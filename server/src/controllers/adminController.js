import { BlogPost } from '../models/BlogPost.js';
import { Consultation } from '../models/Consultation.js';
import { Course } from '../models/Course.js';
import { NewsletterSubscription } from '../models/NewsletterSubscription.js';
import { Order } from '../models/Order.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const overview = asyncHandler(async (req, res) => {
  const [students, consultants, partners, courses, orders, consultations, subscribers] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'consultant' }),
      User.countDocuments({ role: 'partner' }),
      Course.countDocuments({ status: 'published' }),
      Order.find({ status: 'paid' }),
      Consultation.countDocuments(),
      NewsletterSubscription.countDocuments({ status: 'active' })
    ]);

  const revenue = orders.reduce((sum, order) => sum + order.amount, 0);

  res.json({
    students,
    consultants,
    partners,
    courses,
    paidOrders: orders.length,
    consultations,
    subscribers,
    revenue
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json({ users });
});

export const listPayments = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email role')
    .populate('course', 'title slug')
    .sort({ createdAt: -1 });

  res.json({ orders });
});

export const listConsultations = asyncHandler(async (req, res) => {
  const consultations = await Consultation.find()
    .populate('student', 'name email')
    .populate('consultant', 'name email specialty')
    .sort({ scheduledAt: -1 });

  res.json({ consultations });
});

export const listContent = asyncHandler(async (req, res) => {
  const [courses, articles] = await Promise.all([
    Course.find().sort({ createdAt: -1 }),
    BlogPost.find().sort({ publishedAt: -1 })
  ]);

  res.json({ courses, articles });
});

export const upsertSetting = asyncHandler(async (req, res) => {
  const { key, value, description } = req.body;
  const setting = await SystemSetting.findOneAndUpdate(
    { key },
    { key, value, description },
    { upsert: true, new: true, runValidators: true }
  );

  res.json({ setting });
});
