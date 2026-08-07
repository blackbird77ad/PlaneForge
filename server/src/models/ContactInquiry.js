import mongoose from 'mongoose';

const contactInquirySchema = new mongoose.Schema(
  {
    intent: {
      type: String,
      enum: [
        'learner',
        'course_support',
        'b2b',
        'collaboration',
        'consulting',
        'partnership',
        'general'
      ],
      required: true,
      index: true
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    topicSource: {
      type: String,
      enum: ['selected', 'custom'],
      default: 'selected'
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    organization: {
      type: String,
      trim: true,
      maxlength: 140
    },
    role: {
      type: String,
      trim: true,
      maxlength: 120
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    status: {
      type: String,
      enum: ['new', 'in_review', 'responded', 'closed'],
      default: 'new',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    source: {
      type: String,
      default: 'contact_page'
    },
    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

contactInquirySchema.index({ intent: 1, status: 1, createdAt: -1 });

export const ContactInquiry = mongoose.model('ContactInquiry', contactInquirySchema);
