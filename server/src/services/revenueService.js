import Stripe from 'stripe';
import { env } from '../config/env.js';
import { Earning } from '../models/Earning.js';
import { PlatformExpense } from '../models/PlatformExpense.js';
import { User } from '../models/User.js';

const stripe = env.payments.stripeSecretKey ? new Stripe(env.payments.stripeSecretKey) : null;

const roundMoney = (value) => Math.max(0, Math.round(Number(value || 0) * 100) / 100);
const toCents = (value) => Math.round(Number(value || 0) * 100);

const openExpenseAmount = (expense) => roundMoney(Number(expense.amount || 0) - Number(expense.settledAmount || 0));

export const getOpenExpenseTotal = async ({ currency = 'USD', through = new Date() } = {}) => {
  const expenses = await PlatformExpense.find({
    currency,
    settlementStatus: { $ne: 'settled' },
    $or: [{ periodStart: { $exists: false } }, { periodStart: null }, { periodStart: { $lte: through } }]
  });

  return roundMoney(expenses.reduce((sum, expense) => sum + openExpenseAmount(expense), 0));
};

export const settleExpenses = async ({ amount, currency = 'USD', through = new Date() } = {}) => {
  let remaining = roundMoney(amount);
  if (remaining <= 0) return 0;

  const expenses = await PlatformExpense.find({
    currency,
    settlementStatus: { $ne: 'settled' },
    $or: [{ periodStart: { $exists: false } }, { periodStart: null }, { periodStart: { $lte: through } }]
  }).sort({ periodStart: 1, createdAt: 1 });

  let settled = 0;
  for (const expense of expenses) {
    if (remaining <= 0) break;
    const open = openExpenseAmount(expense);
    if (open <= 0) continue;

    const applied = Math.min(open, remaining);
    expense.settledAmount = roundMoney(Number(expense.settledAmount || 0) + applied);
    expense.settlementStatus = expense.settledAmount >= Number(expense.amount || 0) ? 'settled' : 'part_settled';
    if (expense.settlementStatus === 'settled') expense.settledAt = new Date();
    await expense.save();

    remaining = roundMoney(remaining - applied);
    settled = roundMoney(settled + applied);
  }

  return settled;
};

const shareAmount = ({ base, shareType = 'percentage', shareValue = 0 }) =>
  roundMoney(shareType === 'fixed' ? shareValue : Number(base || 0) * (Number(shareValue || 0) / 100));

const earningStatus = ({ vestingEnabled, vestingEndsAt }) =>
  vestingEnabled && vestingEndsAt && vestingEndsAt > new Date() ? 'pending' : 'available';

const vestingEnd = ({ vestingEnabled, vestingDurationDays }) =>
  vestingEnabled && Number(vestingDurationDays || 0) > 0
    ? new Date(Date.now() + Number(vestingDurationDays) * 24 * 60 * 60 * 1000)
    : undefined;

export const createOrderEarnings = async ({ order }) => {
  if (!order || order.status !== 'paid') return [];

  const currency = order.currency || 'USD';
  const grossAmount = roundMoney(order.amount);
  const expenseAmount = await settleExpenses({ amount: grossAmount, currency, through: order.createdAt || new Date() });
  const netAmount = roundMoney(grossAmount - expenseAmount);
  const partners = await User.find({ role: 'partner', status: 'active' });
  const admins = await User.find({ role: 'admin', status: 'active' });
  const earners = [
    ...partners.map((user) => ({ user, role: 'partner' })),
    ...admins.map((user) => ({ user, role: 'admin' }))
  ];

  const created = [];
  for (const { user, role } of earners) {
    const share = user.revenueShare || {};
    const shareValue = Number(share.shareValue ?? (role === 'partner' ? user.commissionRate : 0) ?? 0);
    if (shareValue <= 0) continue;

    const base = share.basedOn === 'gross' ? grossAmount : netAmount;
    const vestingEndsAt = vestingEnd(share);
    const amount = shareAmount({ base, shareType: share.shareType, shareValue });
    if (amount <= 0) continue;

    const earning = await Earning.findOneAndUpdate(
      { order: order._id, earner: user._id, role },
      {
        $setOnInsert: {
          earner: user._id,
          role,
          sourceType: 'order',
          order: order._id,
          grossAmount,
          expenseAmount,
          netAmount,
          shareType: share.shareType || 'percentage',
          shareValue,
          amount,
          currency,
          vestingEnabled: Boolean(share.vestingEnabled),
          vestingEndsAt,
          status: earningStatus({ vestingEnabled: share.vestingEnabled, vestingEndsAt })
        }
      },
      { new: true, upsert: true }
    );
    created.push(earning);
  }

  return created;
};

export const createConsultationEarning = async ({ consultation, consultant }) => {
  if (!consultation || !consultant) return null;

  const share = consultant.revenueShare || {};
  const shareValue = Number(share.shareValue || 100);
  const grossAmount = roundMoney(consultation.amount);
  const expenseAmount = await settleExpenses({
    amount: grossAmount,
    currency: consultation.currency || 'USD',
    through: consultation.createdAt || new Date()
  });
  const netAmount = roundMoney(grossAmount - expenseAmount);
  const base = share.basedOn === 'gross' ? grossAmount : netAmount;
  const vestingEndsAt = vestingEnd(share);
  const amount = shareAmount({ base, shareType: share.shareType || 'percentage', shareValue });

  return Earning.findOneAndUpdate(
    { consultation: consultation._id, earner: consultant._id, role: 'consultant' },
    {
      $setOnInsert: {
        earner: consultant._id,
        role: 'consultant',
        sourceType: 'consultation',
        consultation: consultation._id,
        grossAmount,
        expenseAmount,
        netAmount,
        shareType: share.shareType || 'percentage',
        shareValue,
        amount,
        currency: consultation.currency || 'USD',
        vestingEnabled: Boolean(share.vestingEnabled),
        vestingEndsAt,
        status: earningStatus({ vestingEnabled: share.vestingEnabled, vestingEndsAt })
      }
    },
    { new: true, upsert: true }
  );
};

export const requestEarningWithdrawal = async ({ user, earningId }) => {
  const earning = await Earning.findOne({ _id: earningId, earner: user._id, status: 'available' });
  if (!earning) return null;

  if (stripe && user.stripeConnectAccountId && !env.payments.mock) {
    const transfer = await stripe.transfers.create({
      amount: toCents(earning.amount),
      currency: earning.currency.toLowerCase(),
      destination: user.stripeConnectAccountId,
      metadata: { earningId: earning._id.toString(), earnerId: user._id.toString() }
    });
    earning.stripeTransferId = transfer.id;
    earning.status = 'paid';
  } else {
    earning.status = 'withdrawal_requested';
  }

  await earning.save();
  return earning;
};
