import { BlogPost } from '../models/BlogPost.js';
import { CartItem } from '../models/CartItem.js';
import { Consultation } from '../models/Consultation.js';
import { ContactInquiry } from '../models/ContactInquiry.js';
import { Course } from '../models/Course.js';
import { CourseComment } from '../models/CourseComment.js';
import { Earning } from '../models/Earning.js';
import { Enrollment } from '../models/Enrollment.js';
import { NewsletterSubscription } from '../models/NewsletterSubscription.js';
import { Order } from '../models/Order.js';
import { Progress } from '../models/Progress.js';
import { PlatformExpense } from '../models/PlatformExpense.js';
import { Product } from '../models/Product.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { User } from '../models/User.js';
import { grantCourseAccess, isEnrollmentActive } from '../services/accessService.js';
import { createOrderEarnings } from '../services/revenueService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const userRoles = ['user', 'student', 'consultant', 'partner', 'admin'];
const adminCreatedUserRoles = ['user', 'consultant', 'partner'];
const userStatuses = ['active', 'suspended', 'pending'];
const inquiryStatuses = ['new', 'in_review', 'responded', 'closed'];
const inquiryPriorities = ['low', 'normal', 'high'];
const consultationStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
const orderStatuses = ['pending', 'payment_initialized', 'verified', 'paid', 'failed', 'refunded'];
const articleStatuses = ['draft', 'published'];
const productStatuses = ['draft', 'published', 'archived'];

const pagination = ({ page = 1, limit = 25, maxLimit = 100 } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), maxLimit);
  const currentPage = Math.max(Number(page) || 1, 1);

  return {
    currentPage,
    safeLimit,
    skip: (currentPage - 1) * safeLimit
  };
};

const textSearch = (value, fields) => {
  if (!value?.trim()) return {};
  const regex = new RegExp(value.trim(), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

const parseDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizeUserRole = (role) =>
  !role || ['learner', 'student', 'buyer'].includes(role) ? 'user' : role;

const publicUserRoleQuery = { $in: ['user', 'student'] };

const compactString = (value, maxLength = 240) => {
  if (value == null) return '';
  return String(value).trim().slice(0, maxLength);
};

const normalizeContactNumber = (value) => compactString(value, 80);

const assertFullName = (name) => {
  const value = compactString(name, 120).replace(/\s+/g, ' ');
  if (!value) throw new ApiError(400, 'Full name is required');
  if (value.split(' ').filter(Boolean).length < 2) {
    throw new ApiError(400, 'Enter your full name');
  }
  return value;
};

const parseDateOfBirth = (value) => {
  const rawDate = compactString(value, 40);
  if (!rawDate) {
    throw new ApiError(400, 'Date of birth is required');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    throw new ApiError(400, 'Use a valid date of birth');
  }

  const [year, month, day] = rawDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ApiError(400, 'Use a valid date of birth');
  }

  if (date > new Date()) {
    throw new ApiError(400, 'Date of birth cannot be in the future');
  }

  return date;
};

const hasLockedAccountUpdate = (body = {}) => {
  const lockedFields = ['email', 'contact', 'contactNumber', 'phone', 'dateOfBirth'];
  const profileBody = body.profile && typeof body.profile === 'object' ? body.profile : {};
  return lockedFields.some((field) => field in body || field in profileBody);
};

export const overview = asyncHandler(async (req, res) => {
  const [
    students,
    consultants,
    partners,
    admins,
    courses,
    draftCourses,
    products,
    draftProducts,
    orders,
    pendingOrders,
    consultations,
    cartItems,
    activeCartItems,
    subscribers,
    inquiries,
    activeEnrollments
  ] = await Promise.all([
    User.countDocuments({ role: publicUserRoleQuery }),
    User.countDocuments({ role: 'consultant' }),
    User.countDocuments({ role: 'partner' }),
    User.countDocuments({ role: 'admin' }),
    Course.countDocuments({ status: 'published' }),
    Course.countDocuments({ status: 'draft' }),
    Product.countDocuments({ status: 'published' }),
    Product.countDocuments({ status: 'draft' }),
    Order.find({ status: 'paid' }),
    Order.countDocuments({ status: { $in: ['pending', 'payment_initialized', 'verified'] } }),
    Consultation.countDocuments(),
    CartItem.countDocuments(),
    CartItem.countDocuments({ status: 'active' }),
    NewsletterSubscription.countDocuments({ status: 'active' }),
    ContactInquiry.countDocuments({ status: { $ne: 'closed' } }),
    Enrollment.countDocuments({
      status: 'active',
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    })
  ]);

  const revenue = orders.reduce((sum, order) => sum + order.amount, 0);

  res.json({
    students,
    users: students,
    consultants,
    partners,
    admins,
    courses,
    draftCourses,
    products,
    draftProducts,
    paidOrders: orders.length,
    pendingOrders,
    consultations,
    cartItems,
    activeCartItems,
    subscribers,
    inquiries,
    activeEnrollments,
    revenue
  });
});

export const listActivity = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const safeLimit = Math.min(Math.max(Number(limit) || 40, 1), 100);
  const [
    recentUsers,
    recentOrders,
    recentProgress,
    recentConsultations,
    recentInquiries,
    recentComments,
    recentCartItems
  ] = await Promise.all([
    User.find()
      .select('name email role status createdAt')
      .sort({ createdAt: -1 })
      .limit(safeLimit),
    Order.find()
      .populate('user', 'name email role')
      .populate('course', 'title slug')
      .populate('product', 'title slug sku')
      .sort({ createdAt: -1 })
      .limit(safeLimit),
    Progress.find()
      .populate('user', 'name email role')
      .populate('course', 'title slug')
      .sort({ updatedAt: -1 })
      .limit(safeLimit),
    Consultation.find()
      .populate('student', 'name email role')
      .populate('consultant', 'name email role')
      .sort({ createdAt: -1 })
      .limit(safeLimit),
    ContactInquiry.find()
      .sort({ createdAt: -1 })
      .limit(safeLimit),
    CourseComment.find()
      .populate('user', 'name email role')
      .populate('course', 'title slug')
      .sort({ createdAt: -1 })
      .limit(safeLimit),
    CartItem.find()
      .populate('user', 'name email role')
      .populate('course', 'title slug')
      .populate('product', 'title slug sku')
      .sort({ updatedAt: -1 })
      .limit(safeLimit)
  ]);

  const activities = [
    ...recentUsers.map((user) => ({
      id: `user-${user._id}`,
      type: 'account',
      label: 'Account created',
      actorName: user.name,
      actorEmail: user.email,
      status: user.status,
      detail: `${user.role} account`,
      createdAt: user.createdAt
    })),
    ...recentOrders.map((order) => ({
      id: `order-${order._id}`,
      type: 'purchase',
      label: 'Purchase activity',
      actorName: order.user?.name || order.invoice?.customerName || 'Unknown customer',
      actorEmail: order.user?.email || order.invoice?.customerEmail,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      detail: order.course?.title || order.product?.title || order.invoice?.itemName || order.invoiceNumber,
      createdAt: order.createdAt
    })),
    ...recentProgress.map((item) => ({
      id: `progress-${item._id}`,
      type: 'learning_progress',
      label: 'Learning progress',
      actorName: item.user?.name || 'Unknown learner',
      actorEmail: item.user?.email,
      status: `${item.percentComplete || 0}% complete`,
      detail: item.course?.title || 'Course progress',
      createdAt: item.updatedAt || item.createdAt
    })),
    ...recentConsultations.map((consultation) => ({
      id: `consultation-${consultation._id}`,
      type: 'consulting',
      label: 'Consulting activity',
      actorName: consultation.student?.name || 'Unknown client',
      actorEmail: consultation.student?.email,
      status: consultation.status,
      amount: consultation.amount,
      currency: consultation.currency,
      detail: `${consultation.service} with ${consultation.consultant?.name || 'consultant'}`,
      createdAt: consultation.createdAt
    })),
    ...recentInquiries.map((inquiry) => ({
      id: `inquiry-${inquiry._id}`,
      type: 'inquiry',
      label: 'Contact inquiry',
      actorName: inquiry.name,
      actorEmail: inquiry.email,
      status: inquiry.status,
      detail: `${inquiry.topic || inquiry.intent}: ${inquiry.subject || inquiry.message}`,
      createdAt: inquiry.createdAt
    })),
    ...recentComments.map((comment) => ({
      id: `comment-${comment._id}`,
      type: 'course_comment',
      label: comment.source === 'tutor_request' ? 'Tutor request' : 'Course comment',
      actorName: comment.user?.name || 'Unknown learner',
      actorEmail: comment.user?.email,
      status: comment.status,
      detail: `${comment.course?.title || 'Course'}${comment.lessonTitle ? ` / ${comment.lessonTitle}` : ''}: ${comment.message}`,
      createdAt: comment.createdAt
    })),
    ...recentCartItems.map((item) => ({
      id: `cart-${item._id}`,
      type: 'cart',
      label: 'Cart activity',
      actorName: item.user?.name || 'Unknown account',
      actorEmail: item.user?.email,
      status: item.status,
      amount: item.unitPrice,
      currency: item.currency,
      detail: item.course?.title || item.product?.title || item.productName || item.productId || 'Cart item',
      createdAt: item.updatedAt || item.createdAt
    }))
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, safeLimit);

  res.json({ activities });
});

export const createUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    contactNumber,
    dateOfBirth,
    password,
    role = 'user',
    status = 'active',
    title,
    specialty,
    bio,
    consultationFee,
    languages,
    profile,
    partnerCode,
    commissionRate,
    revenueShare,
    stripeConnectAccountId
  } = req.body;
  const normalizedRole = normalizeUserRole(role);
  const normalizedStatus = status || 'active';
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  const normalizedContactNumber = normalizeContactNumber(contactNumber);

  if (!String(name || '').trim() || !normalizedEmail || !normalizedContactNumber || !normalizedPassword) {
    throw new ApiError(400, 'Name, email, contact number and password are required');
  }

  if (normalizedPassword.length < 8) {
    throw new ApiError(400, 'Use at least 8 characters for the password');
  }

  if (!adminCreatedUserRoles.includes(normalizedRole)) {
    throw new ApiError(400, 'Admin-created accounts must be users, consultants, or partners');
  }

  if (!userStatuses.includes(normalizedStatus)) {
    throw new ApiError(400, 'Invalid user status');
  }

  const parsedDateOfBirth = parseDateOfBirth(dateOfBirth);
  const fullName = assertFullName(name);

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name: fullName,
    email: normalizedEmail,
    contactNumber: normalizedContactNumber,
    dateOfBirth: parsedDateOfBirth,
    passwordHash: await User.hashPassword(normalizedPassword),
    role: normalizedRole,
    status: normalizedStatus,
    title: String(title || '').trim() || undefined,
    specialty: String(specialty || '').trim() || undefined,
    bio: String(bio || '').trim() || undefined,
    consultationFee: Number(consultationFee || 0),
    languages: Array.isArray(languages) && languages.length ? languages : undefined,
    profile: profile && typeof profile === 'object' ? profile : undefined,
    partnerCode: String(partnerCode || '').trim() || undefined,
    commissionRate: Math.max(0, Number(commissionRate || 0)),
    revenueShare: revenueShare && typeof revenueShare === 'object' ? revenueShare : undefined,
    stripeConnectAccountId: String(stripeConnectAccountId || '').trim() || undefined,
    consultationFeeStatus: normalizedRole === 'consultant' && Number(consultationFee || 0) > 0 ? 'approved' : undefined,
    requestedConsultationFee: normalizedRole === 'consultant' ? Number(consultationFee || 0) : undefined,
    consultationFeeReviewedAt: normalizedRole === 'consultant' && Number(consultationFee || 0) > 0 ? new Date() : undefined
  });

  const createdUser = await User.findById(user._id)
    .select('-passwordHash')
    .populate('ownedCourses', 'title slug status');

  res.status(201).json({ user: createdUser });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page, limit } = req.query;
  const { currentPage, safeLimit, skip } = pagination({ page, limit });
  const query = {
    ...textSearch(search, ['name', 'email', 'title', 'specialty', 'profile.organization'])
  };

  if (role) query.role = normalizeUserRole(role) === 'user' ? publicUserRoleQuery : normalizeUserRole(role);
  if (status) query.status = status;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash')
      .populate('ownedCourses', 'title slug status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    User.countDocuments(query)
  ]);

  res.json({
    users,
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total,
      pages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (hasLockedAccountUpdate(req.body)) {
    throw new ApiError(400, 'Email, contact number, and date of birth cannot be changed after account creation');
  }

  const allowed = [
    'name',
    'role',
    'status',
    'title',
    'specialty',
    'bio',
    'consultationFee',
    'languages',
    'profile',
    'availability',
    'qualifications',
    'experienceYears',
    'partnerCode',
    'commissionRate',
    'revenueShare',
    'stripeConnectAccountId',
    'requestedConsultationFee',
    'consultationFeeStatus'
  ];
  const updates = {};

  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  if (updates.role) {
    updates.role = normalizeUserRole(updates.role);
  }

  if ('name' in updates) {
    updates.name = assertFullName(updates.name);
  }

  if (updates.role && !userRoles.includes(updates.role)) {
    throw new ApiError(400, 'Invalid user role');
  }

  if (updates.status && !userStatuses.includes(updates.status)) {
    throw new ApiError(400, 'Invalid user status');
  }

  if (updates.consultationFeeStatus === 'approved') {
    updates.consultationFee = Number(updates.requestedConsultationFee ?? updates.consultationFee ?? 0);
    updates.consultationFeeReviewedAt = new Date();
  }

  if (
    req.params.id === req.user._id.toString() &&
    ((updates.role && updates.role !== 'admin') || (updates.status && updates.status !== 'active'))
  ) {
    throw new ApiError(400, 'You cannot remove your own admin access');
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  })
    .select('-passwordHash')
    .populate('ownedCourses', 'title slug status');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ user });
});

export const listExpenses = asyncHandler(async (req, res) => {
  const expenses = await PlatformExpense.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
  res.json({ expenses });
});

export const createExpense = asyncHandler(async (req, res) => {
  const {
    title,
    category = 'operations',
    amount,
    currency = 'USD',
    periodStart,
    periodEnd,
    settledAmount = 0,
    settlementStatus,
    notes
  } = req.body;

  if (!String(title || '').trim() || Number(amount) < 0) {
    throw new ApiError(400, 'Expense title and amount are required');
  }

  const safeAmount = Number(amount || 0);
  const safeSettled = Math.min(safeAmount, Math.max(0, Number(settledAmount || 0)));
  const status =
    settlementStatus || (safeSettled >= safeAmount ? 'settled' : safeSettled > 0 ? 'part_settled' : 'unsettled');

  const expense = await PlatformExpense.create({
    title: String(title).trim(),
    category,
    amount: safeAmount,
    currency,
    periodStart: parseDate(periodStart),
    periodEnd: parseDate(periodEnd),
    settledAmount: safeSettled,
    settlementStatus: status,
    settledAt: status === 'settled' ? new Date() : undefined,
    notes,
    createdBy: req.user._id
  });

  res.status(201).json({ expense });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await PlatformExpense.findById(req.params.id);
  if (!expense) throw new ApiError(404, 'Expense not found');

  const allowed = ['title', 'category', 'amount', 'currency', 'periodStart', 'periodEnd', 'settledAmount', 'settlementStatus', 'notes'];
  for (const key of allowed) {
    if (key in req.body) expense[key] = ['periodStart', 'periodEnd'].includes(key) ? parseDate(req.body[key]) : req.body[key];
  }

  expense.settledAmount = Math.min(Number(expense.amount || 0), Math.max(0, Number(expense.settledAmount || 0)));
  if (!req.body.settlementStatus) {
    expense.settlementStatus =
      expense.settledAmount >= Number(expense.amount || 0)
        ? 'settled'
        : expense.settledAmount > 0
          ? 'part_settled'
          : 'unsettled';
  }
  if (expense.settlementStatus === 'settled' && !expense.settledAt) expense.settledAt = new Date();
  await expense.save();

  res.json({ expense });
});

export const listEarnings = asyncHandler(async (req, res) => {
  const earnings = await Earning.find()
    .populate('earner', 'name email role partnerCode stripeConnectAccountId')
    .populate('order', 'invoiceNumber itemType amount currency status')
    .populate('consultation', 'service amount currency status')
    .sort({ createdAt: -1 });

  res.json({ earnings });
});

export const grantEnrollment = asyncHandler(async (req, res) => {
  const { courseId, expiresAt } = req.body;
  const [user, course] = await Promise.all([
    User.findById(req.params.id),
    Course.findById(courseId)
  ]);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const existing = await Enrollment.findOne({ user: user._id, course: course._id });
  const parsedExpiresAt = parseDate(expiresAt);

  const enrollment = await Enrollment.findOneAndUpdate(
    { user: user._id, course: course._id },
    {
      $set: {
        user: user._id,
        course: course._id,
        accessType: 'admin_grant',
        status: 'active',
        startsAt: new Date(),
        expiresAt: parsedExpiresAt,
        source: 'admin',
        revokedAt: undefined,
        revokeReason: undefined
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
    .populate('course', 'title slug status')
    .populate('user', 'name email role');

  await Promise.all([
    User.findByIdAndUpdate(user._id, { $addToSet: { ownedCourses: course._id } }),
    !isEnrollmentActive(existing)
      ? Course.findByIdAndUpdate(course._id, { $inc: { studentsEnrolled: 1 } })
      : Promise.resolve(),
    Progress.findOneAndUpdate(
      { user: user._id, course: course._id },
      { $setOnInsert: { user: user._id, course: course._id, percentComplete: 0 } },
      { upsert: true, new: true }
    )
  ]);

  res.status(201).json({ enrollment });
});

export const listPayments = asyncHandler(async (req, res) => {
  const { status, provider, search, page, limit } = req.query;
  const { currentPage, safeLimit, skip } = pagination({ page, limit });
  const query = {};

  if (status) query.status = status;
  if (provider) query.provider = provider;

  let matchingCourseIds;
  let matchingProductIds;
  let matchingUserIds;
  if (search?.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    const [courses, products, users] = await Promise.all([
      Course.find({ title: regex }).select('_id'),
      Product.find({ $or: [{ title: regex }, { sku: regex }] }).select('_id'),
      User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id')
    ]);
    matchingCourseIds = courses.map((course) => course._id);
    matchingProductIds = products.map((product) => product._id);
    matchingUserIds = users.map((user) => user._id);
    query.$or = [
      { invoiceNumber: regex },
      { paymentRef: regex },
      { course: { $in: matchingCourseIds } },
      { product: { $in: matchingProductIds } },
      { user: { $in: matchingUserIds } }
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email role')
      .populate('course', 'title slug')
      .populate('product', 'title slug sku')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Order.countDocuments(query)
  ]);

  res.json({
    orders,
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total,
      pages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  });
});

export const updatePayment = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!orderStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid payment status');
  }

  const order = await Order.findById(req.params.id).populate('user').populate('course').populate('product');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.status = status;
  if (['verified', 'paid'].includes(status)) {
    order.verifiedAt = order.verifiedAt || new Date();
    if (order.itemType === 'course' && !order.accessGrantedAt && order.user && order.course) {
      await grantCourseAccess({
        userId: order.user._id,
        course: order.course,
        order,
        source: 'admin'
      });
      order.accessGrantedAt = new Date();
    }

    if (order.itemType === 'product' && !order.fulfilledAt) {
      if (order.product) {
        const productUpdates = {
          $inc: {
            soldCount: order.quantity || 1
          }
        };

        if (order.product.inventory?.track) {
          productUpdates.$inc['inventory.quantity'] = -Math.max(1, order.quantity || 1);
        }

        await Product.findByIdAndUpdate(order.product._id, productUpdates);
      }

      order.fulfilledAt = new Date();
    }
  }

  await order.save();
  if (order.status === 'paid') {
    await createOrderEarnings({ order });
  }

  if (['verified', 'paid'].includes(status)) {
    const cartLookup = {
      user: order.user._id,
      itemType: order.itemType || 'course',
      status: 'active'
    };
    if (order.itemType === 'product') {
      cartLookup.product = order.product?._id;
    } else {
      cartLookup.course = order.course?._id;
    }

    await CartItem.updateMany(
      cartLookup,
      {
        $set: {
          status: 'converted',
          order: order._id,
          convertedAt: new Date()
        }
      }
    );
  }

  const populatedOrder = await Order.findById(order._id)
    .populate('user', 'name email role')
    .populate('course', 'title slug')
    .populate('product', 'title slug sku');

  res.json({ order: populatedOrder });
});

export const listConsultations = asyncHandler(async (req, res) => {
  const { status, search, page, limit } = req.query;
  const { currentPage, safeLimit, skip } = pagination({ page, limit });
  const query = {};

  if (status) query.status = status;

  if (search?.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    const [students, consultants] = await Promise.all([
      User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id'),
      User.find({ $or: [{ name: regex }, { email: regex }, { specialty: regex }] }).select('_id')
    ]);
    query.$or = [
      { service: regex },
      { category: regex },
      { paymentRef: regex },
      { student: { $in: students.map((user) => user._id) } },
      { consultant: { $in: consultants.map((user) => user._id) } }
    ];
  }

  const [consultations, total] = await Promise.all([
    Consultation.find(query)
      .populate('student', 'name email')
      .populate('consultant', 'name email specialty')
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Consultation.countDocuments(query)
  ]);

  res.json({
    consultations,
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total,
      pages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  });
});

export const updateConsultation = asyncHandler(async (req, res) => {
  const { status, notes, scheduledAt, durationMinutes } = req.body;
  const updates = {};

  if (status) {
    if (!consultationStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid consultation status');
    }
    updates.status = status;
  }
  if ('notes' in req.body) updates.notes = notes;
  if (scheduledAt) updates.scheduledAt = scheduledAt;
  if (durationMinutes) updates.durationMinutes = durationMinutes;

  const consultation = await Consultation.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  })
    .populate('student', 'name email')
    .populate('consultant', 'name email specialty');

  if (!consultation) {
    throw new ApiError(404, 'Consultation not found');
  }

  res.json({ consultation });
});

export const listContent = asyncHandler(async (req, res) => {
  const [courses, articles, products] = await Promise.all([
    Course.find().sort({ createdAt: -1 }),
    BlogPost.find().sort({ publishedAt: -1 }),
    Product.find().sort({ createdAt: -1 })
  ]);

  res.json({ courses, articles, products });
});

export const createProduct = asyncHandler(async (req, res) => {
  if (req.body.status && !productStatuses.includes(req.body.status)) {
    throw new ApiError(400, 'Invalid product status');
  }

  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  if (req.body.status && !productStatuses.includes(req.body.status)) {
    throw new ApiError(400, 'Invalid product status');
  }

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.json({ product });
});

export const archiveProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { status: 'archived' },
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.json({ product, message: 'Product archived' });
});

export const createArticle = asyncHandler(async (req, res) => {
  const article = await BlogPost.create({
    ...req.body,
    author: req.body.author || req.user._id
  });

  res.status(201).json({ article });
});

export const updateArticle = asyncHandler(async (req, res) => {
  if (req.body.status && !articleStatuses.includes(req.body.status)) {
    throw new ApiError(400, 'Invalid article status');
  }

  const article = await BlogPost.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!article) {
    throw new ApiError(404, 'Article not found');
  }

  res.json({ article });
});

export const archiveArticle = asyncHandler(async (req, res) => {
  const article = await BlogPost.findByIdAndUpdate(
    req.params.id,
    { status: 'draft' },
    { new: true, runValidators: true }
  );

  if (!article) {
    throw new ApiError(404, 'Article not found');
  }

  res.json({ article, message: 'Article moved to drafts' });
});

export const listInquiries = asyncHandler(async (req, res) => {
  const { intent, status = 'open', priority, search, page, limit = 80 } = req.query;
  const { currentPage, safeLimit, skip } = pagination({ page, limit, maxLimit: 200 });
  const query = {
    ...textSearch(search, ['name', 'email', 'organization', 'subject', 'message', 'topic'])
  };

  if (intent) query.intent = intent;
  if (priority) query.priority = priority;
  if (status === 'open') query.status = { $ne: 'closed' };
  else if (status) query.status = status;

  const [inquiries, total, byIntent, byStatus, byTopic] = await Promise.all([
    ContactInquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    ContactInquiry.countDocuments(query),
    ContactInquiry.aggregate([
      { $match: query },
      { $group: { _id: '$intent', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    ContactInquiry.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    ContactInquiry.aggregate([
      { $match: query },
      { $group: { _id: { intent: '$intent', topic: '$topic' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ])
  ]);

  res.json({
    inquiries,
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total,
      pages: Math.max(Math.ceil(total / safeLimit), 1)
    },
    grouped: {
      byIntent,
      byStatus,
      byTopic
    }
  });
});

export const updateInquiry = asyncHandler(async (req, res) => {
  const { status, priority } = req.body;
  const updates = {};

  if (status) {
    if (!inquiryStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid inquiry status');
    }
    updates.status = status;
  }

  if (priority) {
    if (!inquiryPriorities.includes(priority)) {
      throw new ApiError(400, 'Invalid inquiry priority');
    }
    updates.priority = priority;
  }

  const inquiry = await ContactInquiry.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  if (!inquiry) {
    throw new ApiError(404, 'Inquiry not found');
  }

  res.json({ inquiry });
});

export const listSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSetting.find().sort({ key: 1 });
  res.json({ settings });
});

export const upsertSetting = asyncHandler(async (req, res) => {
  const { key, value, description } = req.body;

  if (!key?.trim()) {
    throw new ApiError(400, 'Setting key is required');
  }

  const setting = await SystemSetting.findOneAndUpdate(
    { key: key.trim() },
    { key: key.trim(), value, description },
    { upsert: true, new: true, runValidators: true }
  );

  res.json({ setting });
});
