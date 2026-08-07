import crypto from 'crypto';
import mongoose from 'mongoose';

const passwordResetChallengeSchema = new mongoose.Schema(
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

passwordResetChallengeSchema.statics.hashCode = function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
};

passwordResetChallengeSchema.methods.compareCode = function compareCode(code) {
  return this.codeHash === this.constructor.hashCode(code);
};

export const PasswordResetChallenge = mongoose.model(
  'PasswordResetChallenge',
  passwordResetChallengeSchema
);
