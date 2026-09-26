import mongoose from 'mongoose';
import { Certificate } from '../models/Certificate.js';
import { CartItem } from '../models/CartItem.js';
import { Consultation } from '../models/Consultation.js';
import { CourseComment } from '../models/CourseComment.js';
import { Course } from '../models/Course.js';
import { DigitalEntitlement } from '../models/DigitalEntitlement.js';
import { Earning } from '../models/Earning.js';
import { Enrollment } from '../models/Enrollment.js';
import { Order } from '../models/Order.js';
import { ProfileChangeChallenge } from '../models/ProfileChangeChallenge.js';
import { Progress } from '../models/Progress.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { hasCourseAccess } from '../services/accessService.js';
import { sendProfileChangeCodeEmail } from '../services/emailService.js';
import { requestEarningWithdrawal } from '../services/revenueService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { normalizeContactNumber } from '../utils/contactNumber.js';
import { coursePricing } from '../utils/coursePricing.js';
import { productPricing, stockSummary } from '../utils/productPricing.js';

const accountRole = (role) => (['student', 'learner', 'buyer'].includes(role) ? 'user' : role);

const certificateId = () =>
  `PF-CERT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const profileChangeExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

const populateCart = (query) =>
  query
    .populate('course', 'title slug thumbnail price currency discount accessDurationType accessDurationDays')
    .populate('product', 'title slug thumbnail price currency sku productType inventory discount flashSale isHotSale')
    .populate('order', 'invoiceNumber status');

const decorateCartItem = (item) => {
  const data = item.toObject ? item.toObject() : item;
  const pricing =
    data.itemType === 'product' && data.product
      ? productPricing(data.product)
      : data.itemType === 'course' && data.course
        ? coursePricing(data.course)
        : null;

  return {
    ...data,
    pricing,
    stock: data.itemType === 'product' && data.product ? stockSummary(data.product) : undefined
  };
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

const compactString = (value, maxLength = 240) => {
  if (value == null) return '';
  return String(value).trim().slice(0, maxLength);
};

const parseDateOfBirth = (value) => {
  const rawDate = compactString(value, 40);
  if (!rawDate) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    throw new ApiError(400, 'Use a valid date of birth');
  }

  const [year, month, day] = rawDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date > new Date()
  ) {
    throw new ApiError(400, 'Use a valid date of birth');
  }

  return date;
};

const assertFullName = (name) => {
  const value = compactString(name, 120).replace(/\s+/g, ' ');
  if (!value) throw new ApiError(400, 'Full name is required');
  if (value.split(' ').filter(Boolean).length < 2) {
    throw new ApiError(400, 'Enter your full name');
  }
  return value;
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
  const lockedFields = ['email'];
  const profileBody = body.profile && typeof body.profile === 'object' ? body.profile : {};

  if (lockedFields.some((field) => field in body || field in profileBody)) {
    throw new ApiError(400, 'Email cannot be changed from profile settings');
  }

  if (['contact', 'contactNumber', 'phone', 'dateOfBirth'].some((field) => field in body || field in profileBody)) {
    throw new ApiError(400, 'Contact number and date of birth changes require email verification');
  }

  if ('name' in body) {
    updates.name = assertFullName(body.name);
  }
  if ('avatar' in body) updates.avatar = sanitizeAvatar(body.avatar);
  if ('title' in body) updates.title = compactString(body.title, 140);
  if ('specialty' in body) updates.specialty = compactString(body.specialty, 180);
  if ('bio' in body) updates.bio = compactString(body.bio, 1000);
  if ('qualifications' in body) updates.qualifications = sanitizeStringList(body.qualifications);
  if ('experienceYears' in body) updates.experienceYears = Math.max(0, Number(body.experienceYears || 0));
  if ('consultationFee' in body && ['consultant', 'admin'].includes(req.user.role)) {
    const requestedFee = Math.max(0, Number(body.consultationFee || 0));
    if (req.user.role === 'admin') {
      updates.consultationFee = requestedFee;
      updates.requestedConsultationFee = requestedFee;
      updates.consultationFeeStatus = 'approved';
      updates.consultationFeeReviewedAt = new Date();
    } else {
      updates.requestedConsultationFee = requestedFee;
      updates.consultationFeeStatus = 'pending';
    }
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

export const requestProfileChange = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const contactNumber = 'contactNumber' in body ? normalizeContactNumber(body.contactNumber) : undefined;
  const dateOfBirth = 'dateOfBirth' in body ? parseDateOfBirth(body.dateOfBirth) : undefined;
  const updates = {};
  const changes = [];

  if (contactNumber !== undefined && contactNumber !== (req.user.contactNumber || '')) {
    if (!contactNumber) throw new ApiError(400, 'Contact number is required');
    updates.contactNumber = contactNumber;
    changes.push('contact number');
  }

  if (dateOfBirth !== undefined) {
    const current = req.user.dateOfBirth ? new Date(req.user.dateOfBirth).toISOString().slice(0, 10) : '';
    const next = dateOfBirth ? dateOfBirth.toISOString().slice(0, 10) : '';
    if (next && next !== current) {
      updates.dateOfBirth = dateOfBirth;
      changes.push('date of birth');
    }
  }

  if (!changes.length) {
    throw new ApiError(400, 'Enter a new contact number or date of birth to verify');
  }

  const code = generateCode();
  const expiresAt = profileChangeExpiry();

  await ProfileChangeChallenge.updateMany(
    { user: req.user._id, consumedAt: { $exists: false } },
    { $set: { consumedAt: new Date() } }
  );

  const challenge = await ProfileChangeChallenge.create({
    user: req.user._id,
    codeHash: ProfileChangeChallenge.hashCode(code),
    contactNumber: updates.contactNumber,
    dateOfBirth: updates.dateOfBirth,
    expiresAt
  });

  await sendProfileChangeCodeEmail({ user: req.user, code, expiresAt, changes });

  res.status(202).json({
    message: 'Check your email for a verification code to confirm this profile change.',
    challengeId: challenge._id,
    expiresAt,
    changes
  });
});

export const confirmProfileChange = asyncHandler(async (req, res) => {
  const { challengeId, code } = req.body || {};
  if (!challengeId || !code) {
    throw new ApiError(400, 'Challenge id and verification code are required');
  }

  const challenge = await ProfileChangeChallenge.findOne({
    _id: challengeId,
    user: req.user._id,
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });

  if (!challenge) {
    throw new ApiError(401, 'Verification code is invalid or has expired');
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    throw new ApiError(429, 'Too many attempts. Request a new verification code.');
  }

  if (!challenge.compareCode(code)) {
    challenge.attempts += 1;
    await challenge.save();
    throw new ApiError(401, 'Verification code is incorrect');
  }

  const updates = {};
  if (challenge.contactNumber) updates.contactNumber = challenge.contactNumber;
  if (challenge.dateOfBirth) updates.dateOfBirth = challenge.dateOfBirth;
  challenge.consumedAt = new Date();

  const [user] = await Promise.all([
    User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-passwordHash'),
    challenge.save()
  ]);

  res.json({ message: 'Profile security details updated.', user });
});

export const dashboard = asyncHandler(async (req, res) => {
  if (accountRole(req.user.role) === 'user') {
    const [progress, enrollments, orders, digitalProducts, consultations, certificates, comments, cartItems] = await Promise.all([
      Progress.find({ user: req.user._id }).populate(
        'course',
        'title slug thumbnail instructorName duration price currency accessDurationType accessDurationDays'
      ),
      Enrollment.find({ user: req.user._id })
        .populate('course', 'title slug thumbnail instructorName duration price currency accessDurationType accessDurationDays')
        .sort({ updatedAt: -1 }),
      Order.find({ user: req.user._id })
        .populate('course', 'title slug thumbnail')
        .populate('product', 'title slug thumbnail sku productType')
        .sort({ createdAt: -1 }),
      DigitalEntitlement.find({ user: req.user._id, status: 'active' })
        .populate('product', 'title slug thumbnail sku productType category')
        .sort({ updatedAt: -1 }),
      Consultation.find({ student: req.user._id }).populate('consultant', 'name title specialty avatar'),
      Certificate.find({ user: req.user._id }).populate('course', 'title slug'),
      CourseComment.find({ user: req.user._id })
        .populate('course', 'title slug thumbnail')
        .sort({ createdAt: -1 })
        .limit(20),
      populateCart(CartItem.find({ user: req.user._id }).sort({ updatedAt: -1 }).limit(20))
    ]);

    return res.json({
      role: 'user',
      progress,
      enrollments,
      orders,
      digitalProducts,
      consultations,
      certificates,
      comments,
      cartItems: cartItems.map(decorateCartItem)
    });
  }

  if (req.user.role === 'consultant') {
    const [consultations, earnings] = await Promise.all([
      Consultation.find({ consultant: req.user._id })
        .populate('student', 'name email avatar')
        .sort({ scheduledAt: 1 }),
      Earning.find({ earner: req.user._id }).sort({ createdAt: -1 })
    ]);

    return res.json({
      role: 'consultant',
      consultations,
      earnings,
      confirmedRevenue: consultations.reduce((sum, item) => sum + item.amount, 0),
      availableEarnings: earnings
        .filter((earning) => earning.status === 'available')
        .reduce((sum, earning) => sum + Number(earning.amount || 0), 0)
    });
  }

  if (req.user.role === 'partner') {
    const [orders, earnings] = await Promise.all([
      Order.find().populate('course', 'title price'),
      Earning.find({ earner: req.user._id }).sort({ createdAt: -1 })
    ]);
    const commissionRate = Number(req.user.commissionRate || 0);

    return res.json({
      role: 'partner',
      partnerCode: req.user.partnerCode,
      commissionRate,
      siteOrders: orders.length,
      paidOrders: orders.filter((order) => order.status === 'paid').length,
      estimatedCommission: orders.reduce((sum, item) => sum + item.amount * (commissionRate / 100), 0),
      earnings,
      availableEarnings: earnings
        .filter((earning) => earning.status === 'available')
        .reduce((sum, earning) => sum + Number(earning.amount || 0), 0),
      resources: ['Course bundles', 'Enterprise training proposal template', 'Consultation package overview']
    });
  }

  throw new ApiError(403, 'Use the admin dashboard endpoint for administrator data');
});

export const listMyEarnings = asyncHandler(async (req, res) => {
  const earnings = await Earning.find({ earner: req.user._id })
    .populate('order', 'invoiceNumber itemType amount currency status')
    .populate('consultation', 'service amount currency status')
    .sort({ createdAt: -1 });

  res.json({ earnings });
});

export const withdrawEarning = asyncHandler(async (req, res) => {
  const earning = await requestEarningWithdrawal({ user: req.user, earningId: req.params.id });
  if (!earning) {
    throw new ApiError(404, 'Available earning not found');
  }

  res.json({ earning });
});

export const listCartItems = asyncHandler(async (req, res) => {
  const { status = 'active' } = req.query;
  const query = { user: req.user._id };
  if (status) query.status = status;

  const cartItems = await populateCart(CartItem.find(query).sort({ updatedAt: -1 }));

  res.json({ cartItems: cartItems.map(decorateCartItem) });
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
    const stock = stockSummary(product);
    const safeQuantity = Math.max(1, Number(quantity || 1));
    if (!stock.canPurchase) {
      throw new ApiError(409, 'Product is out of stock');
    }
    if (product.productType !== 'digital' && product.inventory?.track && !product.inventory.allowBackorder && safeQuantity > Number(product.inventory.quantity || 0)) {
      throw new ApiError(409, 'Requested quantity is not available');
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
        unitPrice:
          itemType === 'product'
            ? productPricing(product).finalPrice ?? Number(unitPrice || 0)
            : coursePricing(course).finalPrice ?? course?.price ?? 0,
        currency: itemType === 'product' ? product.currency || currency || 'USD' : course?.currency || 'USD',
        status: 'active',
        source
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await item.populate('course', 'title slug thumbnail price currency discount accessDurationType accessDurationDays');
  await item.populate('product', 'title slug thumbnail price currency sku productType inventory discount flashSale isHotSale');

  res.status(201).json({ cartItem: decorateCartItem(item) });
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
  if (progress.percentComplete === 100 && !progress.completedAt) {
    progress.completedAt = new Date();
  }

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
