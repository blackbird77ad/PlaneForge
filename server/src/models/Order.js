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
