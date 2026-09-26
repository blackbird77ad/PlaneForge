import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    itemType: {
      type: String,
      enum: ['course', 'product'],
      default: 'course',
      index: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required() {
        return this.itemType === 'course';
      }
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required() {
        return this.itemType === 'product';
      }
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    items: [
      {
        itemType: {
          type: String,
          enum: ['course', 'product']
        },
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course'
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        title: String,
        slug: String,
        sku: String,
        productType: {
          type: String,
          enum: ['physical', 'digital']
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1
        },
        originalUnitPrice: Number,
        unitPrice: Number,
        discountAmount: Number,
        lineTotal: Number,
        currency: String
      }
    ],
    productType: {
      type: String,
      enum: ['physical', 'digital']
    },
    originalAmount: Number,
    discountAmount: {
      type: Number,
      default: 0
    },
    unitPrice: Number,
    productSnapshot: {
      title: String,
      slug: String,
      sku: String,
      productType: String,
      thumbnail: String,
      category: String
    },
    pricingSnapshot: mongoose.Schema.Types.Mixed,
    shippingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      region: String,
      country: String,
      postalCode: String
    },
    fulfillmentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'processing', 'shipped', 'delivered', 'digital_ready', 'inventory_exception', 'cancelled'],
      default: 'not_required'
    },
    digitalFulfillmentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'ready', 'revoked'],
      default: 'not_required'
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    provider: {
      type: String,
      enum: ['stripe'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'payment_initialized', 'verified', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentRef: {
      type: String,
      required: true
    },
    couponCode: String,
    accessGrantedAt: Date,
    fulfilledAt: Date,
    verifiedAt: Date,
    rawPaymentEvent: mongoose.Schema.Types.Mixed,
    invoiceNumber: {
      type: String,
      required: true
    },
    invoice: {
      customerName: String,
      customerEmail: String,
      itemName: String,
      issuedAt: Date,
      html: String
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
