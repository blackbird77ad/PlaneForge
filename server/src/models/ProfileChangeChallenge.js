import crypto from 'crypto';
import mongoose from 'mongoose';

const profileChangeChallengeSchema = new mongoose.Schema(
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
    contactNumber: String,
    dateOfBirth: Date,
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

profileChangeChallengeSchema.statics.hashCode = function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
};

profileChangeChallengeSchema.methods.compareCode = function compareCode(code) {
  return this.codeHash === this.constructor.hashCode(code);
};

export const ProfileChangeChallenge = mongoose.model(
  'ProfileChangeChallenge',
  profileChangeChallengeSchema
);
