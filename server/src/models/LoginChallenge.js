import crypto from 'crypto';
import mongoose from 'mongoose';

const loginChallengeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    codeHash: {
      type: String,
      required: true
    },
    deviceId: {
      type: String,
      required: true
    },
    userAgent: String,
    ipAddress: String,
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    consumedAt: Date
  },
  { timestamps: true }
);

loginChallengeSchema.statics.hashCode = function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
};

loginChallengeSchema.methods.compareCode = function compareCode(code) {
  return this.codeHash === this.constructor.hashCode(code);
};

export const LoginChallenge = mongoose.model('LoginChallenge', loginChallengeSchema);
