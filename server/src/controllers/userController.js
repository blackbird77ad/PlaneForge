import { Certificate } from '../models/Certificate.js';
import { Consultation } from '../models/Consultation.js';
import { Course } from '../models/Course.js';
import { Order } from '../models/Order.js';
import { Progress } from '../models/Progress.js';
import { User } from '../models/User.js';
import { hasCourseAccess } from '../services/accessService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const certificateId = () =>
  `PF-CERT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const findLesson = (course, lessonId) => {
  for (const module of course.modules || []) {
    const lesson = module.lessons.id(lessonId);
    if (lesson) {
      return { module, lesson };
    }
  }

  return null;
};

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = [
    'name',
    'avatar',
    'title',
    'specialty',
    'bio',
    'qualifications',
    'experienceYears',
    'consultationFee',
    'languages',
    'profile',
    'availability'
  ];

  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  }).select('-passwordHash');

  res.json({ user });
});

export const dashboard = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    const [progress, orders, consultations, certificates] = await Promise.all([
      Progress.find({ user: req.user._id }).populate(
        'course',
        'title slug thumbnail instructorName duration'
      ),
      Order.find({ user: req.user._id }).populate('course', 'title slug thumbnail').sort({ createdAt: -1 }),
      Consultation.find({ student: req.user._id }).populate('consultant', 'name title specialty avatar'),
      Certificate.find({ user: req.user._id }).populate('course', 'title slug')
    ]);

    return res.json({ role: 'student', progress, orders, consultations, certificates });
  }

  if (req.user.role === 'consultant') {
    const consultations = await Consultation.find({ consultant: req.user._id })
      .populate('student', 'name email avatar')
      .sort({ scheduledAt: 1 });

    return res.json({
      role: 'consultant',
      consultations,
      earnings: consultations.reduce((sum, item) => sum + item.amount, 0)
    });
  }

  if (req.user.role === 'partner') {
    const orders = await Order.find().populate('course', 'title price');
    return res.json({
      role: 'partner',
      referrals: 28,
      estimatedCommission: orders.reduce((sum, item) => sum + item.amount * 0.08, 0),
      resources: ['Co-branded course bundles', 'Enterprise training proposal template']
    });
  }

  throw new ApiError(403, 'Use the admin dashboard endpoint for administrator data');
});

export const saveLessonProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const lessonId = req.params.lessonId || req.body.lessonId;
  const { positionSeconds = 0, watchedSeconds = 0, durationSeconds, completed = false } = req.body;

  if (!lessonId) {
    throw new ApiError(400, 'Lesson is required');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const canAccess = await hasCourseAccess({ user: req.user, courseId: course._id });
  if (!canAccess) {
    throw new ApiError(403, 'Purchase this course before tracking progress');
  }

  const match = findLesson(course, lessonId);
  if (!match) {
    throw new ApiError(404, 'Lesson not found');
  }

  const moduleId = match.module._id.toString();
  const normalizedLessonId = match.lesson._id.toString();
  const lessonDuration = Number(durationSeconds || match.lesson.durationSeconds || 0);
  const normalizedWatched = Math.max(Number(watchedSeconds) || 0, 0);
  const normalizedPosition = Math.max(Number(positionSeconds) || 0, 0);
  const hasMetThreshold = lessonDuration
    ? normalizedWatched >= lessonDuration * 0.9
    : Boolean(completed);
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);

  const progress = await Progress.findOneAndUpdate(
    { user: req.user._id, course: course._id },
    {
      $setOnInsert: { user: req.user._id, course: course._id, percentComplete: 0 },
      $set: { lastAccessedAt: new Date() }
    },
    { upsert: true, new: true }
  );

  const existingLesson = progress.lessonProgress.find(
    (item) => item.lessonId === normalizedLessonId
  );
  const previousWatched = existingLesson?.watchedSeconds || 0;

  if (existingLesson) {
    existingLesson.moduleId = moduleId;
    existingLesson.positionSeconds = normalizedPosition;
    existingLesson.durationSeconds = lessonDuration;
    existingLesson.watchedSeconds = Math.max(previousWatched, normalizedWatched);
    existingLesson.lastWatchedAt = new Date();
    if (hasMetThreshold && !existingLesson.completedAt) {
      existingLesson.completedAt = new Date();
    }
  } else {
    progress.lessonProgress.push({
      moduleId,
      lessonId: normalizedLessonId,
      positionSeconds: normalizedPosition,
      durationSeconds: lessonDuration,
      watchedSeconds: normalizedWatched,
      completedAt: hasMetThreshold ? new Date() : undefined,
      lastWatchedAt: new Date()
    });
  }

  progress.currentLesson = { moduleId, lessonId: normalizedLessonId };
  progress.totalTimeSeconds += Math.max(0, normalizedWatched - previousWatched);

  const alreadyCompleted = progress.completedLessons.some(
    (item) => item.lessonId === normalizedLessonId
  );

  if (hasMetThreshold && !alreadyCompleted) {
    progress.completedLessons.push({
      moduleId,
      lessonId: normalizedLessonId,
      watchedSeconds: normalizedWatched,
      durationSeconds: lessonDuration,
      completedAt: new Date()
    });
  }

  progress.percentComplete = totalLessons
    ? Math.min(Math.round((progress.completedLessons.length / totalLessons) * 100), 100)
    : 0;

  let certificate = null;
  if (progress.percentComplete === 100 && course.certificateAvailable && !progress.certificateIssued) {
    certificate = await Certificate.create({
      user: req.user._id,
      course: course._id,
      certificateId: certificateId()
    });
    progress.certificateIssued = true;
  }

  await progress.save();

  res.json({ progress, certificate });
});

export const completeLesson = saveLessonProgress;
