import mongoose from 'mongoose';

const digitalEntitlementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'refunded'],
      default: 'active',
      index: true
    },
    source: {
      type: String,
      enum: ['payment_webhook', 'free_product', 'admin'],
      default: 'payment_webhook'
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    revokedAt: Date,
    revokeReason: String,
    accessCount: {
      type: Number,
      default: 0
    },
    lastAccessedAt: Date
  },
  { timestamps: true }
);

digitalEntitlementSchema.index({ user: 1, product: 1 }, { unique: true });

export const DigitalEntitlement = mongoose.model('DigitalEntitlement', digitalEntitlementSchema);
