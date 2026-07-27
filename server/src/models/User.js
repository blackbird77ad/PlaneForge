import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    organization: String,
    country: String,
    headline: String,
    website: String
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    slots: [String]
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'consultant', 'partner', 'admin'],
      default: 'student'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active'
    },
    avatar: String,
    title: String,
    specialty: String,
    bio: String,
    qualifications: [String],
    experienceYears: {
      type: Number,
      default: 0
    },
    consultationFee: {
      type: Number,
      default: 0
    },
    languages: {
      type: [String],
      default: ['English']
    },
    profile: profileSchema,
    availability: [availabilitySchema],
    ownedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
    partnerCode: String,
    lastLoginAt: Date
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 12);
};

export const User = mongoose.model('User', userSchema);
