import Stripe from 'stripe';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const stripe = env.payments.stripeSecretKey
  ? new Stripe(env.payments.stripeSecretKey)
  : null;

const toCents = (amount) => Math.round(Number(amount) * 100);

export const createPayment = async ({
  provider,
  amount,
  currency = 'USD',
  description,
  email,
  successUrl,
  cancelUrl,
  metadata = {}
}) => {
  const normalizedProvider = provider || 'mock';

  if (env.payments.mock) {
    return {
      provider: 'mock',
      status: 'payment_initialized',
      paymentRef: `mock_${Date.now()}`,
      amount,
      currency,
      checkoutUrl: null,
      verificationRequired: true
    };
  }

  if (normalizedProvider === 'mock') {
    throw new ApiError(400, 'Mock payments are disabled');
  }

  if (normalizedProvider === 'stripe') {
    if (!stripe) {
      throw new ApiError(400, 'Stripe is not configured');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      success_url: successUrl || `${env.clientUrl}/checkout/complete`,
      cancel_url: cancelUrl || env.clientUrl,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: toCents(amount),
            product_data: {
              name: description || 'PlaneForge payment'
            }
          }
        }
      ],
      payment_intent_data: {
        description,
        metadata
      },
      metadata
    });

    return {
      provider: 'stripe',
      status: 'payment_initialized',
      paymentRef: session.id,
      amount,
      currency,
      checkoutUrl: session.url,
      checkoutSessionId: session.id,
      verificationRequired: true
    };
  }

  if (normalizedProvider === 'paystack') {
    if (!env.payments.paystackSecretKey) {
      throw new ApiError(400, 'Paystack is not configured');
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.payments.paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: toCents(amount),
        currency,
        email,
        channels: ['card', 'mobile_money', 'bank', 'ussd', 'bank_transfer'],
        callback_url: `${env.clientUrl}/checkout/complete`,
        metadata: {
          ...metadata,
          description
        }
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.status) {
      throw new ApiError(400, payload.message || 'Unable to initialize Paystack payment');
    }

    return {
      provider: 'paystack',
      status: 'payment_initialized',
      paymentRef: payload.data.reference,
      amount,
      currency,
      checkoutUrl: payload.data.authorization_url,
      accessCode: payload.data.access_code,
      verificationRequired: true
    };
  }

  throw new ApiError(400, 'Unsupported payment provider');
};
