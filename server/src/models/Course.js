import mongoose from 'mongoose';
import slugify from 'slugify';

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: String,
    duration: {
      type: String,
      default: '8 min'
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    isPreview: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    },
    stream: {
      provider: {
        type: String,
        enum: ['cloudflare', 'mux', 'bunny', 'vimeo', 'external', 'unconfigured'],
        default: 'unconfigured'
      },
      assetId: String,
      playbackId: String,
      uploadId: String,
      status: {
        type: String,
        enum: ['not_uploaded', 'uploading', 'processing', 'ready', 'failed'],
        default: 'not_uploaded'
      },
      signedPlaybackRequired: {
        type: Boolean,
        default: true
      },
      allowDownloads: {
        type: Boolean,
        default: false
      }
    },
    resources: [
      {
        label: String,
        url: String,
        type: String,
        downloadable: {
          type: Boolean,
          default: false
        }
      }
    ],
    videoUrl: {
      type: String,
      select: false
    },
    resourceUrls: {
      type: [String],
      select: false,
      default: undefined
    }
  },
  { timestamps: true }
);

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: String,
    order: {
      type: Number,
      default: 0
    },
    lessons: [lessonSchema]
  },
  { timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    studentName: String,
    avatar: String,
    occupation: String,
    displayNamePublic: {
      type: Boolean,
      default: true
    },
    anonymous: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    comment: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'approved'
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date
  },
  { timestamps: true }
);

const courseSchema = new mongoose.Schema(
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
    subtitle: String,
    description: {
      type: String,
      required: true
    },
    thumbnail: String,
    bannerImage: String,
    images: [String],
    videoUrl: String,
    category: {
      type: String,
      required: true
    },
    discipline: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional', 'Capstone'],
      default: 'Beginner'
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    instructorName: String,
    language: {
      type: String,
      default: 'English'
    },
    price: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    purchaseType: {
      type: String,
      enum: ['one_time', 'subscription'],
      default: 'one_time'
    },
    subscriptionDurationDays: {
      type: Number,
      default: null
    },
    paymentProviderOverrides: [
      {
        country: String,
        provider: {
          type: String,
          enum: ['stripe']
        }
      }
    ],
    trailer: {
      provider: String,
      assetId: String,
      playbackId: String
    },
    duration: {
      type: String,
      default: '4h 30m'
    },
    rating: {
      type: Number,
      default: 0
    },
    studentsEnrolled: {
      type: Number,
      default: 0
    },
    outcomes: [String],
    skills: [String],
    requirements: [String],
    targetAudience: [String],
    faqs: [
      {
        question: String,
        answer: String
      }
    ],
    modules: [moduleSchema],
    reviews: [reviewSchema],
    resources: [
      {
        label: String,
        url: String,
        type: String,
        size: Number,
        downloadable: {
          type: Boolean,
          default: true
        }
      }
    ],
    accessDurationType: {
      type: String,
      enum: ['lifetime', 'limited'],
      default: 'lifetime'
    },
    accessDurationDays: {
      type: Number,
      default: null,
      min: 1
    },
    discount: {
      enabled: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
      },
      value: {
        type: Number,
        default: 0,
        min: 0
      },
      startsAt: Date,
      endsAt: Date
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    certificateAvailable: {
      type: Boolean,
      default: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    }
  },
  { timestamps: true }
);

courseSchema.index({
  title: 'text',
  subtitle: 'text',
  description: 'text',
  category: 'text',
  discipline: 'text',
  instructorName: 'text'
});

courseSchema.pre('validate', function setSlug(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  if (this.accessDurationType === 'lifetime') {
    this.accessDurationDays = null;
  }
  if (this.discount?.type === 'percentage' && Number(this.discount.value || 0) > 100) {
    this.invalidate('discount.value', 'Discount percentage cannot exceed 100');
  }
  if (this.discount?.startsAt && this.discount?.endsAt && this.discount.endsAt < this.discount.startsAt) {
    this.invalidate('discount.endsAt', 'Discount end date cannot be before the start date');
  }
  next();
});

export const Course = mongoose.model('Course', courseSchema);
