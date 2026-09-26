import mongoose from 'mongoose';

const applicationAnswerSchema = new mongoose.Schema(
  {
    key: String,
    label: String,
    type: String,
    value: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

const applicationDocumentSchema = new mongoose.Schema(
  {
    key: String,
    label: String,
    fileName: String,
    mimeType: String,
    size: Number,
    data: String
  },
  { timestamps: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    from: String,
    to: String,
    note: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const internalNoteSchema = new mongoose.Schema(
  {
    note: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const careerApplicationSchema = new mongoose.Schema(
  {
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CareerPosition',
      required: true,
      index: true
    },
    applicant: {
      firstName: String,
      lastName: String,
      email: {
        type: String,
        required: true,
        index: true
      },
      phone: String,
      country: String,
      city: String
    },
    professional: {
      currentPosition: String,
      yearsExperience: String,
      linkedIn: String,
      portfolio: String,
      github: String,
      website: String
    },
    answers: [applicationAnswerSchema],
    documents: [applicationDocumentSchema],
    status: {
      type: String,
      enum: ['new', 'under_review', 'shortlisted', 'assessment', 'interview', 'selected', 'rejected', 'withdrawn'],
      default: 'new',
      index: true
    },
    statusHistory: [statusHistorySchema],
    internalNotes: [internalNoteSchema],
    source: {
      type: String,
      enum: ['internal_form', 'external'],
      default: 'internal_form'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

careerApplicationSchema.index({ position: 1, 'applicant.email': 1 });

export const CareerApplication = mongoose.model('CareerApplication', careerApplicationSchema);
