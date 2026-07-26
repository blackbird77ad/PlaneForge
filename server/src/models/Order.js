import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
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
      enum: ['stripe', 'paystack', 'mock'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentRef: {
      type: String,
      required: true
    },
    couponCode: String,
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
