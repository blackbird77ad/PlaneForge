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
    shortDescription: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    subcategory: {
      type: String,
      trim: true
    },
    brand: {
      type: String,
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
    videoUrl: String,
    tags: [String],
    specifications: [
      {
        label: String,
        value: String
      }
    ],
    digitalAssets: [
      {
        label: String,
        url: String,
        type: {
          type: String,
          default: 'file'
        },
        fileName: String,
        size: Number,
        downloadable: {
          type: Boolean,
          default: true
        }
      }
    ],
    digitalDelivery: {
      instructions: String,
      accessLabel: String
    },
    shipping: {
      requiresShipping: {
        type: Boolean,
        default: true
      },
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
          type: String,
          default: 'cm'
        }
      },
      handlingTime: String,
      returnPolicy: String
    },
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
      },
      lowStockThreshold: {
        type: Number,
        default: 5,
        min: 0
      },
      allowBackorder: {
        type: Boolean,
        default: false
      }
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'unpublished', 'archived'],
      default: 'draft',
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isHotSale: {
      type: Boolean,
      default: false
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
    flashSale: {
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
  this.inventory = this.inventory || {};
  this.shipping = this.shipping || {};
  if (this.productType === 'digital') {
    this.inventory.track = false;
    this.shipping.requiresShipping = false;
  }
  for (const path of ['discount', 'flashSale']) {
    const sale = this[path];
    if (sale?.type === 'percentage' && Number(sale.value || 0) > 100) {
      this.invalidate(`${path}.value`, 'Percentage discount cannot exceed 100');
    }
    if (sale?.startsAt && sale?.endsAt && sale.endsAt < sale.startsAt) {
      this.invalidate(`${path}.endsAt`, 'Sale end date cannot be before the start date');
    }
  }
  next();
});

export const Product = mongoose.model('Product', productSchema);
