import { BlogPost } from '../models/BlogPost.js';
import { Consultation } from '../models/Consultation.js';
import { ContactInquiry } from '../models/ContactInquiry.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { NewsletterSubscription } from '../models/NewsletterSubscription.js';
import { Order } from '../models/Order.js';
import { Progress } from '../models/Progress.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { User } from '../models/User.js';
import { grantCourseAccess, isEnrollmentActive } from '../services/accessService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const userRoles = ['student', 'consultant', 'partner', 'admin'];
const userStatuses = ['active', 'suspended', 'pending'];
const inquiryStatuses = ['new', 'in_review', 'responded', 'closed'];
const inquiryPriorities = ['low', 'normal', 'high'];
const consultationStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
const orderStatuses = ['pending', 'payment_initialized', 'verified', 'paid', 'failed', 'refunded'];
const articleStatuses = ['draft', 'published'];

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

export const overview = asyncHandler(async (req, res) => {
  const [
    students,
    consultants,
    partners,
    admins,
    courses,
    draftCourses,
    orders,
    pendingOrders,
    consultations,
    subscribers,
    inquiries,
    activeEnrollments
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'consultant' }),
    User.countDocuments({ role: 'partner' }),
    User.countDocuments({ role: 'admin' }),
    Course.countDocuments({ status: 'published' }),
    Course.countDocuments({ status: 'draft' }),
    Order.find({ status: 'paid' }),
    Order.countDocuments({ status: { $in: ['pending', 'payment_initialized', 'verified'] } }),
    Consultation.countDocuments(),
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
    consultants,
    partners,
    admins,
    courses,
    draftCourses,
    paidOrders: orders.length,
    pendingOrders,
    consultations,
    subscribers,
    inquiries,
    activeEnrollments,
    revenue
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page, limit } = req.query;
  const { currentPage, safeLimit, skip } = pagination({ page, limit });
  const query = {
    ...textSearch(search, ['name', 'email', 'title', 'specialty', 'profile.organization'])
  };

  if (role) query.role = role;
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
    'availability'
  ];
  const updates = {};

  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  if (updates.role && !userRoles.includes(updates.role)) {
    throw new ApiError(400, 'Invalid user role');
  }

  if (updates.status && !userStatuses.includes(updates.status)) {
    throw new ApiError(400, 'Invalid user status');
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
  let matchingUserIds;
  if (search?.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    const [courses, users] = await Promise.all([
      Course.find({ title: regex }).select('_id'),
      User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id')
    ]);
    matchingCourseIds = courses.map((course) => course._id);
    matchingUserIds = users.map((user) => user._id);
    query.$or = [
      { invoiceNumber: regex },
      { paymentRef: regex },
      { course: { $in: matchingCourseIds } },
      { user: { $in: matchingUserIds } }
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email role')
      .populate('course', 'title slug')
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

  const order = await Order.findById(req.params.id).populate('user').populate('course');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.status = status;
  if (['verified', 'paid'].includes(status)) {
    order.verifiedAt = order.verifiedAt || new Date();
    if (!order.accessGrantedAt && order.user && order.course) {
      await grantCourseAccess({
        userId: order.user._id,
        course: order.course,
        order,
        source: 'admin'
      });
      order.accessGrantedAt = new Date();
    }
  }

  await order.save();

  const populatedOrder = await Order.findById(order._id)
    .populate('user', 'name email role')
    .populate('course', 'title slug');

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
  const [courses, articles] = await Promise.all([
    Course.find().sort({ createdAt: -1 }),
    BlogPost.find().sort({ publishedAt: -1 })
  ]);

  res.json({ courses, articles });
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
