import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    itemType: {
      type: String,
      enum: ['course', 'product'],
      default: 'course',
      index: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productId: String,
    productName: String,
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    unitPrice: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    status: {
      type: String,
      enum: ['active', 'converted', 'removed'],
      default: 'active',
      index: true
    },
    source: {
      type: String,
      default: 'course_detail'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    convertedAt: Date,
    removedAt: Date
  },
  { timestamps: true }
);

cartItemSchema.index({ user: 1, status: 1, updatedAt: -1 });

export const CartItem = mongoose.model('CartItem', cartItemSchema);
