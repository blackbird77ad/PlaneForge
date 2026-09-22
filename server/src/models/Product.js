import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema(
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
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      trim: true,
      index: true
    },
    productType: {
      type: String,
      enum: ['physical', 'digital'],
      default: 'physical'
    },
    thumbnail: String,
    images: [String],
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    inventory: {
      track: {
        type: Boolean,
        default: false
      },
      quantity: {
        type: Number,
        default: 0
      }
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    soldCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

productSchema.index({
  title: 'text',
  description: 'text',
  category: 'text',
  sku: 'text'
});

productSchema.pre('validate', function setSlug(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

export const Product = mongoose.model('Product', productSchema);
