import mongoose from 'mongoose';

const earningSchema = new mongoose.Schema(
  {
    earner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['partner', 'consultant', 'admin'], required: true, index: true },
    sourceType: {
      type: String,
      enum: ['order', 'consultation', 'manual'],
      required: true,
      index: true
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
    grossAmount: { type: Number, required: true, min: 0 },
    expenseAmount: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    shareType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    shareValue: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    vestingEnabled: { type: Boolean, default: false },
    vestingEndsAt: Date,
    status: {
      type: String,
      enum: ['pending', 'available', 'withdrawal_requested', 'paid', 'cancelled'],
      default: 'pending',
      index: true
    },
    stripeTransferId: String,
    stripePayoutId: String,
    notes: String
  },
  { timestamps: true }
);

earningSchema.index({ order: 1, earner: 1, role: 1 }, { unique: true, sparse: true });
earningSchema.index({ consultation: 1, earner: 1, role: 1 }, { unique: true, sparse: true });

export const Earning = mongoose.model('Earning', earningSchema);
