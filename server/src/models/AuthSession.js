import mongoose from 'mongoose';

const authSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    deviceId: {
      type: String,
      required: true,
      index: true
    },
    userAgent: String,
    browser: String,
    operatingSystem: String,
    ipAddress: String,
    loginAt: {
      type: Date,
      default: Date.now
    },
    lastActivityAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    revokedAt: Date,
    revokeReason: String
  },
  { timestamps: true }
);

authSessionSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });

export const AuthSession = mongoose.model('AuthSession', authSessionSchema);
