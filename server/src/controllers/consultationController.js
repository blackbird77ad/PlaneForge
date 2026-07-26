import { Consultation } from '../models/Consultation.js';
import { User } from '../models/User.js';
import { createPayment } from '../services/paymentService.js';
import { sendConsultationEmail } from '../services/emailService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listConsultants = asyncHandler(async (req, res) => {
  const consultants = await User.find({ role: 'consultant', status: 'active' }).select(
    'name avatar title specialty bio qualifications experienceYears consultationFee languages availability'
  );

  res.json({ consultants });
});

export const bookConsultation = asyncHandler(async (req, res) => {
  const {
    consultantId,
    service,
    category,
    scheduledAt,
    durationMinutes = 60,
    provider = 'mock',
    notes
  } = req.body;

  if (!consultantId || !service || !category || !scheduledAt) {
    throw new ApiError(400, 'Consultant, service, category and schedule are required');
  }

  const consultant = await User.findOne({
    _id: consultantId,
    role: 'consultant',
    status: 'active'
  });

  if (!consultant) {
    throw new ApiError(404, 'Consultant not found');
  }

  const amount = consultant.consultationFee || 150;
  const payment = await createPayment({
    provider,
    amount,
    currency: 'USD',
    description: `PlaneForge consultation: ${service}`,
    metadata: {
      userId: req.user._id.toString(),
      consultantId: consultant._id.toString()
    }
  });

  const consultation = await Consultation.create({
    student: req.user._id,
    consultant: consultant._id,
    service,
    category,
    scheduledAt,
    durationMinutes,
    amount,
    provider: payment.provider,
    paymentRef: payment.paymentRef,
    status: payment.status === 'paid' ? 'confirmed' : 'pending',
    notes
  });

  if (consultation.status === 'confirmed') {
    await sendConsultationEmail({ user: req.user, consultant, consultation });
  }

  res.status(201).json({ consultation, payment });
});

export const listMyConsultations = asyncHandler(async (req, res) => {
  const roleQuery =
    req.user.role === 'consultant'
      ? { consultant: req.user._id }
      : { student: req.user._id };

  const consultations = await Consultation.find(roleQuery)
    .populate('student', 'name email avatar')
    .populate('consultant', 'name email avatar title specialty')
    .sort({ scheduledAt: 1 });

  res.json({ consultations });
});
