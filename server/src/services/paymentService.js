import Stripe from 'stripe';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const stripe = env.payments.stripeSecretKey
  ? new Stripe(env.payments.stripeSecretKey)
  : null;

const toCents = (amount) => Math.round(Number(amount) * 100);

export const createPayment = async ({ provider, amount, currency = 'USD', description, metadata = {} }) => {
  const normalizedProvider = provider || 'mock';

  if (env.payments.mock || normalizedProvider === 'mock') {
    return {
      provider: 'mock',
      status: 'paid',
      paymentRef: `mock_${Date.now()}`,
      amount,
      currency,
      checkoutUrl: null
    };
  }

  if (normalizedProvider === 'stripe') {
    if (!stripe) {
      throw new ApiError(400, 'Stripe is not configured');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: toCents(amount),
      currency: currency.toLowerCase(),
      description,
      metadata
    });

    return {
      provider: 'stripe',
      status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
      paymentRef: paymentIntent.id,
      amount,
      currency,
      clientSecret: paymentIntent.client_secret
    };
  }

  if (normalizedProvider === 'paystack') {
    if (!env.payments.paystackSecretKey) {
      throw new ApiError(400, 'Paystack is not configured');
    }

    return {
      provider: 'paystack',
      status: 'pending',
      paymentRef: `paystack_init_${Date.now()}`,
      amount,
      currency,
      checkoutUrl: null
    };
  }

  throw new ApiError(400, 'Unsupported payment provider');
};
