import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    accessType: {
      type: String,
      enum: ['one_time', 'subscription', 'admin_grant'],
      default: 'one_time'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked'],
      default: 'active',
      index: true
    },
    startsAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    revokedAt: Date,
    revokeReason: String,
    source: {
      type: String,
      enum: ['payment_webhook', 'mock_verification', 'free_course', 'admin'],
      default: 'payment_webhook'
    }
  },
  { timestamps: true }
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
