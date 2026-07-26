import { Certificate } from '../models/Certificate.js';
import { Consultation } from '../models/Consultation.js';
import { Course } from '../models/Course.js';
import { Order } from '../models/Order.js';
import { Progress } from '../models/Progress.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const certificateId = () => `PF-CERT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

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
      Progress.find({ user: req.user._id }).populate('course', 'title slug thumbnail instructorName duration'),
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

export const completeLesson = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { moduleId, lessonId } = req.body;

  if (!moduleId || !lessonId) {
    throw new ApiError(400, 'Module and lesson are required');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const ownsCourse = req.user.ownedCourses?.some((id) => id.toString() === course._id.toString());
  if (!ownsCourse && req.user.role !== 'admin') {
    throw new ApiError(403, 'Purchase this course before tracking progress');
  }

  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const progress = await Progress.findOneAndUpdate(
    {
      user: req.user._id,
      course: course._id,
      'completedLessons.lessonId': { $ne: lessonId }
    },
    {
      $push: {
        completedLessons: {
          moduleId,
          lessonId,
          completedAt: new Date()
        }
      },
      lastAccessedAt: new Date()
    },
    { new: true }
  );

  const currentProgress =
    progress ||
    (await Progress.findOne({ user: req.user._id, course: course._id }));

  const percentComplete = totalLessons
    ? Math.min(Math.round((currentProgress.completedLessons.length / totalLessons) * 100), 100)
    : 0;

  currentProgress.percentComplete = percentComplete;

  let certificate = null;
  if (percentComplete === 100 && course.certificateAvailable && !currentProgress.certificateIssued) {
    certificate = await Certificate.create({
      user: req.user._id,
      course: course._id,
      certificateId: certificateId()
    });
    currentProgress.certificateIssued = true;
  }

  await currentProgress.save();

  res.json({ progress: currentProgress, certificate });
});
