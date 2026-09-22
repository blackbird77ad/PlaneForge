import mongoose from 'mongoose';
import { Certificate } from '../models/Certificate.js';
import { CartItem } from '../models/CartItem.js';
import { Consultation } from '../models/Consultation.js';
import { CourseComment } from '../models/CourseComment.js';
import { Course } from '../models/Course.js';
import { Order } from '../models/Order.js';
import { Progress } from '../models/Progress.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { hasCourseAccess } from '../services/accessService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const accountRole = (role) => (['student', 'learner', 'buyer'].includes(role) ? 'user' : role);

const certificateId = () =>
  `PF-CERT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const populateCart = (query) =>
  query
    .populate('course', 'title slug thumbnail price currency')
    .populate('product', 'title slug thumbnail price currency sku')
    .populate('order', 'invoiceNumber status');

const findLesson = (course, lessonId) => {
  for (const module of course.modules || []) {
    const lesson = module.lessons.id(lessonId);
    if (lesson) {
      return { module, lesson };
    }
  }

  return null;
};

const compactString = (value, maxLength = 240) => {
  if (value == null) return '';
  return String(value).trim().slice(0, maxLength);
};

const sanitizeStringList = (value) => {
  if (Array.isArray(value)) return value.map((item) => compactString(item, 80)).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => compactString(item, 80)).filter(Boolean);
  return [];
};

const sanitizeAvatar = (value) => {
  const avatar = compactString(value, 1_600_000);
  if (!avatar) return '';
  if (/^https?:\/\//i.test(avatar) || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(avatar)) {
    return avatar;
  }
  throw new ApiError(400, 'Profile image must be a valid image URL or uploaded image data');
};

const profileStringFields = {
  organization: 240,
  country: 120,
  headline: 180,
  website: 240,
  city: 120,
  learningGoal: 400,
  experienceLevel: 80
};

const sanitizeProfile = (profile = {}) => {
  if (!profile || typeof profile !== 'object') return {};

  return Object.fromEntries(
    Object.entries(profileStringFields)
      .filter(([field]) => field in profile)
      .map(([field, maxLength]) => [field, compactString(profile[field], maxLength)])
  );
};

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  const body = req.body || {};
  const lockedFields = ['email', 'contact', 'contactNumber', 'phone', 'dateOfBirth'];
  const profileBody = body.profile && typeof body.profile === 'object' ? body.profile : {};

  if (lockedFields.some((field) => field in body || field in profileBody)) {
    throw new ApiError(400, 'Email, contact number, and date of birth cannot be changed after sign-up');
  }

  if ('name' in body) {
    const name = compactString(body.name, 120);
    if (!name) throw new ApiError(400, 'Name is required');
    updates.name = name;
  }
  if ('avatar' in body) updates.avatar = sanitizeAvatar(body.avatar);
  if ('title' in body) updates.title = compactString(body.title, 140);
  if ('specialty' in body) updates.specialty = compactString(body.specialty, 180);
  if ('bio' in body) updates.bio = compactString(body.bio, 1000);
  if ('qualifications' in body) updates.qualifications = sanitizeStringList(body.qualifications);
  if ('experienceYears' in body) updates.experienceYears = Math.max(0, Number(body.experienceYears || 0));
  if ('consultationFee' in body && ['consultant', 'admin'].includes(req.user.role)) {
    updates.consultationFee = Math.max(0, Number(body.consultationFee || 0));
  }
  if ('languages' in body) updates.languages = sanitizeStringList(body.languages);
  if ('profile' in body) {
    updates.profile = {
      ...(req.user.profile?.toObject?.() || req.user.profile || {}),
      ...sanitizeProfile(body.profile)
    };
  }
  if ('availability' in body && ['consultant', 'admin'].includes(req.user.role)) {
    updates.availability = Array.isArray(body.availability) ? body.availability : [];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  }).select('-passwordHash');

  res.json({ user });
});

export const dashboard = asyncHandler(async (req, res) => {
  if (accountRole(req.user.role) === 'user') {
    const [progress, orders, consultations, certificates, comments, cartItems] = await Promise.all([
      Progress.find({ user: req.user._id }).populate(
        'course',
        'title slug thumbnail instructorName duration'
      ),
      Order.find({ user: req.user._id }).populate('course', 'title slug thumbnail').sort({ createdAt: -1 }),
      Consultation.find({ student: req.user._id }).populate('consultant', 'name title specialty avatar'),
      Certificate.find({ user: req.user._id }).populate('course', 'title slug'),
      CourseComment.find({ user: req.user._id })
        .populate('course', 'title slug thumbnail')
        .sort({ createdAt: -1 })
        .limit(20),
      populateCart(CartItem.find({ user: req.user._id }).sort({ updatedAt: -1 }).limit(20))
    ]);

    return res.json({ role: 'user', progress, orders, consultations, certificates, comments, cartItems });
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
    const commissionRate = Number(req.user.commissionRate || 0);

    return res.json({
      role: 'partner',
      partnerCode: req.user.partnerCode,
      commissionRate,
      siteOrders: orders.length,
      paidOrders: orders.filter((order) => order.status === 'paid').length,
      estimatedCommission: orders.reduce((sum, item) => sum + item.amount * (commissionRate / 100), 0),
      resources: ['Course bundles', 'Enterprise training proposal template', 'Consultation package overview']
    });
  }

  throw new ApiError(403, 'Use the admin dashboard endpoint for administrator data');
});

export const listCartItems = asyncHandler(async (req, res) => {
  const { status = 'active' } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const cartItems = await populateCart(CartItem.find(query).sort({ updatedAt: -1 }));

  res.json({ cartItems });
});

export const addCartItem = asyncHandler(async (req, res) => {
  const { courseId, productId, quantity = 1, unitPrice = 0, currency = 'USD', source = 'course_detail' } = req.body;
  const itemType = productId ? 'product' : 'course';
  let course = null;
  let product = null;

  if (itemType === 'course') {
    if (!mongoose.isValidObjectId(courseId)) {
      throw new ApiError(400, 'Valid course id is required');
    }

    course = await Course.findById(courseId);
    if (!course || course.status !== 'published') {
      throw new ApiError(404, 'Course not found');
    }
  }

  if (itemType === 'product') {
    if (!mongoose.isValidObjectId(productId)) {
      throw new ApiError(400, 'Valid product id is required');
    }

    product = await Product.findById(productId);
    if (!product || product.status !== 'published') {
      throw new ApiError(404, 'Product not found');
    }
  }

  const lookup =
    itemType === 'course'
      ? { user: req.user._id, itemType, course: course._id, status: 'active' }
      : { user: req.user._id, itemType, product: product._id, status: 'active' };
  const item = await CartItem.findOneAndUpdate(
    lookup,
    {
      $set: {
        user: req.user._id,
        itemType,
        course: course?._id,
        product: product?._id,
        productId: itemType === 'product' ? productId : undefined,
        productName: itemType === 'product' ? product.title : undefined,
        quantity: Math.max(1, Number(quantity || 1)),
        unitPrice: itemType === 'product' ? product.price || Number(unitPrice || 0) : course?.price || 0,
        currency: itemType === 'product' ? product.currency || currency || 'USD' : course?.currency || 'USD',
        status: 'active',
        source
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await item.populate('course', 'title slug thumbnail price currency');
  await item.populate('product', 'title slug thumbnail price currency sku');

  res.status(201).json({ cartItem: item });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const item = await populateCart(
    CartItem.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'active' },
      {
        $set: {
          status: 'removed',
          removedAt: new Date()
        }
      },
      { new: true }
    )
  );

  if (!item) {
    throw new ApiError(404, 'Cart item not found');
  }

  res.json({ cartItem: item });
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
