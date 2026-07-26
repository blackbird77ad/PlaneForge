import mongoose from 'mongoose';

const newsletterSubscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    source: {
      type: String,
      default: 'website'
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active'
    }
  },
  { timestamps: true }
);

export const NewsletterSubscription = mongoose.model(
  'NewsletterSubscription',
  newsletterSubscriptionSchema
);
