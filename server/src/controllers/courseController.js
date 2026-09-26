import { Course } from '../models/Course.js';
import { CourseComment } from '../models/CourseComment.js';
import { Progress } from '../models/Progress.js';
import { User } from '../models/User.js';
import { grantCourseAccess, hasCourseAccess } from '../services/accessService.js';
import { createDirectUploadIntent, createPlaybackGrant, refreshMuxLessonStream } from '../services/streamingService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { accessSummary, coursePricing } from '../utils/coursePricing.js';

const sortMap = {
  popular: { studentsEnrolled: -1 },
  rating: { rating: -1 },
  newest: { createdAt: -1 },
  priceAsc: { price: 1 },
  priceDesc: { price: -1 },
  alphabetical: { title: 1 }
};

const publicReview = (review) => {
  const data = review.toObject ? review.toObject() : review;
  const anonymous = Boolean(data.anonymous) || data.displayNamePublic === false;
  const name = anonymous ? 'Anonymous' : String(data.studentName || 'Learner').split(' ')[0];

  return {
    _id: data._id,
    studentName: name,
    avatar: anonymous ? '' : data.avatar,
    rating: data.rating,
    comment: data.comment,
    createdAt: data.createdAt
  };
};

const publicResource = (resource, includeUrl = false) => ({
  label: resource.label,
  type: resource.type,
  size: resource.size,
  downloadable: Boolean(resource.downloadable),
  ...(includeUrl ? { url: resource.url } : {})
});

const publicLesson = (lesson, includeProtected = false) => {
  const data = lesson.toObject ? lesson.toObject() : lesson;
  const stream = data.stream || {};

  return {
    _id: data._id,
    title: data.title,
    description: data.description,
    duration: data.duration,
    durationSeconds: data.durationSeconds,
    isPreview: data.isPreview,
    order: data.order,
    resources: data.resources?.map((resource) => publicResource(resource, includeProtected)) || [],
    stream: {
      provider: stream.provider,
      status: stream.status,
      signedPlaybackRequired: stream.signedPlaybackRequired !== false,
      hasPlayback: Boolean(stream.playbackId || stream.assetId)
    }
  };
};

const publicCourse = (course, extra = {}) => {
  const data = course.toObject ? course.toObject() : course;
  const includeProtected = extra.access === 'unlocked';
  const approvedReviews = (data.reviews || []).filter((review) => !review.status || review.status === 'approved');

  return {
    ...data,
    ...extra,
    pricing: coursePricing(data),
    accessDuration: accessSummary(data),
    reviews: approvedReviews.map(publicReview),
    resources: data.resources?.map((resource) => ({
      label: resource.label,
      type: resource.type,
      size: resource.size,
      downloadable: Boolean(resource.downloadable),
      ...(includeProtected ? { url: resource.url } : {})
    })),
    modules: data.modules?.map((module) => ({
      _id: module._id,
      title: module.title,
      description: module.description,
      order: module.order,
      lessons: module.lessons?.map((lesson) => publicLesson(lesson, includeProtected)) || []
    }))
  };
};

const refreshCourseRating = async (course) => {
  const approved = (course.reviews || []).filter((review) => !review.status || review.status === 'approved');
  course.rating = approved.length
    ? Number((approved.reduce((sum, review) => sum + Number(review.rating || 0), 0) / approved.length).toFixed(1))
    : 0;
};

const findLesson = (course, lessonId) => {
  for (const module of course.modules || []) {
    const lesson = module.lessons.id(lessonId);
    if (lesson) {
      return { module, lesson };
    }
  }

  return null;
};

const normalizeCourseInput = (body = {}) => {
  const next = { ...body };
  const isPublishing = next.status === 'published';

  if (!String(next.title || '').trim()) {
    next.title = isPublishing ? '' : `Untitled course ${Date.now()}`;
  }
  if (!String(next.description || '').trim() && !isPublishing) {
    next.description = 'Draft course description';
  }
  if (!String(next.category || '').trim() && !isPublishing) {
    next.category = 'Uncategorized';
  }
  if (!String(next.discipline || '').trim() && !isPublishing) {
    next.discipline = 'General';
  }

  return next;
};

const publishIssues = (body = {}) => {
  const modules = body.modules || [];
  const lessons = modules.flatMap((module) => module.lessons || []);
  const issues = [];

  if (!String(body.title || '').trim()) issues.push('Add a course title');
  if (!String(body.description || '').trim()) issues.push('Add a course description');
  if (!String(body.category || '').trim()) issues.push('Choose a course category');
  if (!String(body.discipline || '').trim()) issues.push('Choose a course discipline');
  if (!String(body.thumbnail || '').trim()) issues.push('Add a course thumbnail');
  if (!modules.length) issues.push('Add at least one module');
  if (!lessons.length) issues.push('Add at least one lesson');

  return issues;
};

export const listCourses = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    discipline,
    difficulty,
    instructor,
    price,
    language,
    sort = 'popular',
    page = 1,
    limit = 12,
    featured
  } = req.query;

  const query = { status: 'published' };

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { title: regex },
      { subtitle: regex },
      { description: regex },
      { category: regex },
      { discipline: regex },
      { instructorName: regex }
    ];
  }

  if (category) query.category = category;
  if (discipline) query.discipline = discipline;
  if (difficulty) query.difficulty = difficulty;
  if (language) query.language = language;
  if (instructor) query.instructorName = new RegExp(instructor, 'i');
  if (featured === 'true') query.isFeatured = true;
  if (price === 'free') query.price = 0;
  if (price === 'paid') query.price = { $gt: 0 };
  if (price === 'under100') query.price = { $lte: 100 };

  const safeLimit = Math.min(Number(limit) || 12, 24);
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * safeLimit;

  const [courses, total] = await Promise.all([
    Course.find(query)
      .populate('instructor', 'name avatar title specialty')
      .sort(sortMap[sort] || sortMap.popular)
      .skip(skip)
      .limit(safeLimit),
    Course.countDocuments(query)
  ]);

  res.json({
    courses: courses.map((course) => publicCourse(course)),
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit)
    }
  });
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, status: 'published' }).populate(
    'instructor',
    'name avatar title specialty bio qualifications experienceYears'
  );

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  res.json({ course: publicCourse(course) });
});

export const getLearningCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, status: { $ne: 'archived' } }).populate(
    'instructor',
    'name avatar title specialty bio qualifications experienceYears'
  );

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const canAccess = await hasCourseAccess({ user: req.user, courseId: course._id });

  if (!canAccess) {
    throw new ApiError(403, 'Purchase this course to unlock protected lessons');
  }

  const progress = await Progress.findOne({ user: req.user._id, course: course._id });
  res.json({ course: publicCourse(course, { access: 'unlocked', progress }) });
});

export const getLessonPlayback = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, status: { $ne: 'archived' } });

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const match = findLesson(course, req.params.lessonId);
  if (!match) {
    throw new ApiError(404, 'Lesson not found');
  }

  const canAccess =
    match.lesson.isPreview || (await hasCourseAccess({ user: req.user, courseId: course._id }));

  if (!canAccess) {
    throw new ApiError(403, 'Purchase this course to stream this lesson');
  }

  res.json({
    playback: createPlaybackGrant({
      course,
      lesson: match.lesson,
      user: req.user,
      session: req.authSession
    })
  });
});

export const listCourseComments = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, status: 'published' });

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const canAccess = await hasCourseAccess({ user: req.user, courseId: course._id });
  if (!canAccess) {
    throw new ApiError(403, 'Purchase this course to view comments');
  }

  const comments = await CourseComment.find({ course: course._id })
    .populate('user', 'name email role avatar')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ comments });
});

export const createCourseComment = asyncHandler(async (req, res) => {
  const { lessonId, message, source = 'lesson_comment' } = req.body;
  const course = await Course.findOne({ slug: req.params.slug, status: 'published' });

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const canAccess = await hasCourseAccess({ user: req.user, courseId: course._id });
  if (!canAccess) {
    throw new ApiError(403, 'Purchase this course before adding comments');
  }

  if (!String(message || '').trim()) {
    throw new ApiError(400, 'Comment message is required');
  }

  const match = lessonId ? findLesson(course, lessonId) : null;
  const comment = await CourseComment.create({
    user: req.user._id,
    course: course._id,
    lessonId: match?.lesson?._id?.toString() || undefined,
    lessonTitle: match?.lesson?.title || undefined,
    message: String(message).trim(),
    source: source === 'tutor_request' ? 'tutor_request' : 'lesson_comment'
  });

  await comment.populate('user', 'name email role avatar');

  res.status(201).json({ comment });
});

export const enrollFreeCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, status: 'published' });

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const pricing = coursePricing(course);
  if (!pricing.isFree) {
    throw new ApiError(402, 'Payment is required for this course');
  }

  const enrollment = await grantCourseAccess({
    userId: req.user._id,
    course,
    source: 'free_course',
    price: 0
  });

  res.status(201).json({ enrollment, course: publicCourse(course, { access: 'unlocked' }) });
});

export const submitCourseReview = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, status: { $ne: 'archived' } });

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const canAccess = await hasCourseAccess({ user: req.user, courseId: course._id });
  if (!canAccess) {
    throw new ApiError(403, 'Complete enrollment before reviewing this course');
  }

  const progress = await Progress.findOne({ user: req.user._id, course: course._id });
  if (!progress?.completedAt && Number(progress?.percentComplete || 0) < 100) {
    throw new ApiError(403, 'Complete the course before submitting a review');
  }

  const rating = Math.min(Math.max(Number(req.body.rating || 0), 1), 5);
  const comment = String(req.body.comment || '').trim();
  if (!comment) {
    throw new ApiError(400, 'Review text is required');
  }

  const existing = course.reviews.find((review) => review.student?.toString() === req.user._id.toString());
  const reviewData = {
    student: req.user._id,
    studentName: req.user.name,
    avatar: req.user.avatar,
    occupation: req.user.title || req.user.role,
    rating,
    comment,
    displayNamePublic: req.body.displayNamePublic !== false,
    anonymous: req.body.displayNamePublic === false || Boolean(req.body.anonymous),
    status: 'pending',
    moderatedBy: undefined,
    moderatedAt: undefined
  };

  if (existing) {
    Object.assign(existing, reviewData);
  } else {
    course.reviews.push(reviewData);
  }

  await refreshCourseRating(course);
  await course.save();

  res.status(201).json({
    message: 'Review submitted for moderation.',
    review: {
      rating,
      comment,
      status: 'pending',
      displayNamePublic: reviewData.displayNamePublic
    }
  });
});

export const createCourse = asyncHandler(async (req, res) => {
  const body = normalizeCourseInput(req.body);
  const issues = body.status === 'published' ? publishIssues(body) : [];
  if (issues.length) {
    throw new ApiError(400, `Course is not ready to publish: ${issues.join(', ')}`);
  }

  const instructor = body.instructor ? await User.findById(body.instructor) : null;

  const course = await Course.create({
    ...body,
    instructor: instructor?._id,
    instructorName: body.instructorName || instructor?.name
  });

  res.status(201).json({ course });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const body = normalizeCourseInput(req.body);
  const issues = body.status === 'published' ? publishIssues(body) : [];
  if (issues.length) {
    throw new ApiError(400, `Course is not ready to publish: ${issues.join(', ')}`);
  }

  const course = await Course.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true
  });

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  res.json({ course });
});

export const createLessonStreamUpload = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const module = course.modules.id(req.params.moduleId);
  const lesson = module?.lessons.id(req.params.lessonId);

  if (!module || !lesson) {
    throw new ApiError(404, 'Lesson not found');
  }

  const upload = await createDirectUploadIntent({ course, lesson });
  res.json({ upload });
});

export const refreshLessonStream = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const module = course.modules.id(req.params.moduleId);
  const lesson = module?.lessons.id(req.params.lessonId);

  if (!module || !lesson) {
    throw new ApiError(404, 'Lesson not found');
  }

  const stream = await refreshMuxLessonStream({ course, lesson });
  res.json({ stream });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { status: 'archived' },
    { new: true }
  );

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  res.json({ message: 'Course archived' });
});
