import mongoose from 'mongoose';
import slugify from 'slugify';

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    excerpt: String,
    body: String,
    image: String,
    category: String,
    readingTime: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    }
  },
  { timestamps: true }
);

blogPostSchema.pre('validate', function setSlug(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

export const BlogPost = mongoose.model('BlogPost', blogPostSchema);
