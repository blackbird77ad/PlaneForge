import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    certificateId: {
      type: String,
      required: true,
      unique: true
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    url: String
  },
  { timestamps: true }
);

export const Certificate = mongoose.model('Certificate', certificateSchema);
