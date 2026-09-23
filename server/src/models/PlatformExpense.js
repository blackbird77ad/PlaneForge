import mongoose from 'mongoose';

const platformExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'operations', trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    periodStart: Date,
    periodEnd: Date,
    settlementStatus: {
      type: String,
      enum: ['unsettled', 'part_settled', 'settled'],
      default: 'unsettled',
      index: true
    },
    settledAmount: { type: Number, default: 0, min: 0 },
    settledAt: Date,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const PlatformExpense = mongoose.model('PlatformExpense', platformExpenseSchema);
