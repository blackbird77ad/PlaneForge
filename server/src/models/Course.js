import mongoose from 'mongoose';
import slugify from 'slugify';

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      default: '8 min'
    },
    isPreview: {
      type: Boolean,
      default: false
    },
    videoUrl: String,
    resourceUrls: [String]
  },
  { timestamps: true }
);

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
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
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    comment: String
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
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
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
        type: String
      }
    ],
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
  next();
});

export const Course = mongoose.model('Course', courseSchema);
