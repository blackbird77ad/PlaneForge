import mongoose from 'mongoose';
import slugify from 'slugify';

const listFieldSchema = new mongoose.Schema(
  {
    text: String
  },
  { _id: false }
);

const hiringStageSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    format: {
      type: String,
      enum: ['remote', 'in_person', 'phone', 'video_call', 'assessment', 'other'],
      default: 'remote'
    }
  },
  { timestamps: true }
);

const applicationFieldSchema = new mongoose.Schema(
  {
    key: String,
    label: String,
    description: String,
    type: {
      type: String,
      enum: ['short_text', 'long_text', 'single_choice', 'multiple_choice', 'yes_no', 'number', 'date', 'file'],
      default: 'short_text'
    },
    required: {
      type: Boolean,
      default: false
    },
    placeholder: String,
    options: [String]
  },
  { timestamps: true }
);

const careerPositionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    hiringCompany: {
      type: String,
      default: 'PlaneForge',
      trim: true
    },
    department: String,
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'internship', 'temporary', 'volunteer'],
      default: 'full_time'
    },
    workArrangement: {
      type: String,
      enum: ['remote', 'hybrid', 'on_site'],
      default: 'remote'
    },
    location: String,
    country: String,
    locationDescription: String,
    remoteEligibility: String,
    shortDescription: String,
    description: String,
    salaryRange: String,
    responsibilities: [listFieldSchema],
    requirements: [listFieldSchema],
    preferredQualifications: [listFieldSchema],
    benefits: [listFieldSchema],
    hiringProcess: [hiringStageSchema],
    applicationMethod: {
      type: String,
      enum: ['internal', 'external'],
      default: 'internal'
    },
    externalApplyUrl: String,
    applicationFields: [applicationFieldSchema],
    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'archived'],
      default: 'draft',
      index: true
    },
    publishAt: Date,
    applicationDeadline: Date,
    autoClose: {
      type: Boolean,
      default: true
    },
    closingBehavior: {
      type: String,
      enum: ['remove', 'keep_closed', 'keep_temporarily'],
      default: 'keep_closed'
    },
    closedVisibleUntil: Date,
    closedAt: Date,
    archivedAt: Date
  },
  { timestamps: true }
);

careerPositionSchema.index({
  title: 'text',
  shortDescription: 'text',
  description: 'text',
  department: 'text',
  hiringCompany: 'text',
  location: 'text',
  country: 'text'
});

careerPositionSchema.pre('validate', function setSlug(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  if (this.applicationMethod === 'external' && this.externalApplyUrl) {
    try {
      const url = new URL(this.externalApplyUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        this.invalidate('externalApplyUrl', 'External application URL must be http or https');
      }
    } catch {
      this.invalidate('externalApplyUrl', 'External application URL must be valid');
    }
  }
  if (this.applicationDeadline && this.publishAt && this.applicationDeadline < this.publishAt) {
    this.invalidate('applicationDeadline', 'Application deadline cannot be before publish date');
  }
  next();
});

export const CareerPosition = mongoose.model('CareerPosition', careerPositionSchema);
