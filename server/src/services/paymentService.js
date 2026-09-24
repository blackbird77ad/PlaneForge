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
  const normalizedProvider = provider || 'stripe';

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

  throw new ApiError(400, 'Stripe is the only supported payment provider');
};
