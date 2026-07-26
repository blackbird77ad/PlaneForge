import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const sortMap = {
  popular: { studentsEnrolled: -1 },
  rating: { rating: -1 },
  newest: { createdAt: -1 },
  priceAsc: { price: 1 },
  priceDesc: { price: -1 },
  alphabetical: { title: 1 }
};

const publicLesson = (lesson) => ({
  ...lesson,
  videoUrl: lesson.isPreview ? lesson.videoUrl : undefined,
  resourceUrls: lesson.isPreview ? lesson.resourceUrls : []
});

const publicCourse = (course) => {
  const data = course.toObject ? course.toObject() : course;
  return {
    ...data,
    modules: data.modules?.map((module) => ({
      ...module,
      lessons: module.lessons?.map(publicLesson)
    }))
  };
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
    courses: courses.map(publicCourse),
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
  const course = await Course.findOne({ slug: req.params.slug, status: 'published' }).populate(
    'instructor',
    'name avatar title specialty bio qualifications experienceYears'
  );

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const ownsCourse = req.user.ownedCourses?.some((id) => id.toString() === course._id.toString());
  const canAccess = ownsCourse || req.user.role === 'admin';

  if (!canAccess) {
    throw new ApiError(403, 'Purchase this course to unlock protected lessons');
  }

  res.json({ course });
});

export const createCourse = asyncHandler(async (req, res) => {
  const instructor = req.body.instructor
    ? await User.findById(req.body.instructor)
    : null;

  const course = await Course.create({
    ...req.body,
    instructor: instructor?._id,
    instructorName: req.body.instructorName || instructor?.name
  });

  res.status(201).json({ course });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  res.json({ course });
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
