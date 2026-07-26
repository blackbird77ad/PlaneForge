import { Course } from '../models/Course.js';
import { Order } from '../models/Order.js';
import { Progress } from '../models/Progress.js';
import { User } from '../models/User.js';
import { createInvoice, createInvoiceNumber } from '../services/invoiceService.js';
import { createPayment } from '../services/paymentService.js';
import { sendEnrollmentEmail } from '../services/emailService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const applyCoupon = (price, couponCode) => {
  if (!couponCode) return price;
  if (couponCode.toUpperCase() === 'FORGE10') return Number((price * 0.9).toFixed(2));
  return price;
};

export const checkoutCourse = asyncHandler(async (req, res) => {
  const { courseId, provider = 'mock', couponCode, termsAccepted } = req.body;

  if (!termsAccepted) {
    throw new ApiError(400, 'Terms must be accepted before payment');
  }

  const course = await Course.findById(courseId);

  if (!course || course.status !== 'published') {
    throw new ApiError(404, 'Course not found');
  }

  const owned = req.user.ownedCourses?.some((id) => id.toString() === course._id.toString());
  if (owned) {
    throw new ApiError(409, 'Course is already unlocked');
  }

  const amount = applyCoupon(course.price, couponCode);
  const payment = await createPayment({
    provider,
    amount,
    currency: course.currency,
    description: `PlaneForge course: ${course.title}`,
    metadata: {
      userId: req.user._id.toString(),
      courseId: course._id.toString()
    }
  });

  const invoiceNumber = createInvoiceNumber();
  const invoice = createInvoice({
    invoiceNumber,
    user: req.user,
    itemName: course.title,
    amount,
    currency: course.currency
  });

  const order = await Order.create({
    user: req.user._id,
    course: course._id,
    amount,
    currency: course.currency,
    provider: payment.provider,
    status: payment.status === 'paid' ? 'paid' : 'pending',
    paymentRef: payment.paymentRef,
    couponCode,
    invoiceNumber,
    invoice
  });

  if (order.status === 'paid') {
    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $addToSet: { ownedCourses: course._id } }),
      Course.findByIdAndUpdate(course._id, { $inc: { studentsEnrolled: 1 } }),
      Progress.findOneAndUpdate(
        { user: req.user._id, course: course._id },
        { $setOnInsert: { user: req.user._id, course: course._id, percentComplete: 0 } },
        { upsert: true, new: true }
      )
    ]);

    await sendEnrollmentEmail({ user: req.user, course, invoiceNumber });
  }

  res.status(201).json({ order, payment });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('course', 'title slug thumbnail instructorName')
    .sort({ createdAt: -1 });

  res.json({ orders });
});
