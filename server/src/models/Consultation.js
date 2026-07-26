import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    consultant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    service: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    durationMinutes: {
      type: Number,
      default: 60
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    provider: {
      type: String,
      enum: ['stripe', 'paystack', 'mock'],
      required: true
    },
    paymentRef: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'confirmed'
    },
    notes: String
  },
  { timestamps: true }
);

export const Consultation = mongoose.model('Consultation', consultationSchema);
