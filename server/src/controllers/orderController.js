import crypto from 'crypto';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { env } from '../config/env.js';
import { CartItem } from '../models/CartItem.js';
import { Course } from '../models/Course.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { grantCourseAccess, hasCourseAccess } from '../services/accessService.js';
import { sendEnrollmentEmail } from '../services/emailService.js';
import { createInvoice, createInvoiceNumber } from '../services/invoiceService.js';
import { createPayment } from '../services/paymentService.js';
import { createOrderEarnings } from '../services/revenueService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const stripe = env.payments.stripeSecretKey ? new Stripe(env.payments.stripeSecretKey) : null;

const applyCoupon = (price, couponCode) => {
  if (!couponCode) return price;
  if (couponCode.toUpperCase() === 'FORGE10') return Number((price * 0.9).toFixed(2));
  return price;
};

const completeVerifiedOrder = async ({ order, rawPaymentEvent, source = 'payment_webhook' }) => {
  const populatedOrder = await Order.findById(order._id)
    .populate('user')
    .populate('course')
    .populate('product');

  if (!populatedOrder) {
    throw new ApiError(404, 'Order not found');
  }

  if (['failed', 'refunded'].includes(populatedOrder.status)) {
    throw new ApiError(409, 'This order cannot grant access');
  }

  const shouldGrantCourseAccess = populatedOrder.itemType === 'course' && !populatedOrder.accessGrantedAt;
  const shouldFulfillProduct = populatedOrder.itemType === 'product' && !populatedOrder.fulfilledAt;

  populatedOrder.status = 'verified';
  populatedOrder.verifiedAt = populatedOrder.verifiedAt || new Date();
  populatedOrder.rawPaymentEvent = rawPaymentEvent || populatedOrder.rawPaymentEvent;
  await populatedOrder.save();

  if (shouldGrantCourseAccess) {
    await grantCourseAccess({
      userId: populatedOrder.user._id,
      course: populatedOrder.course,
      order: populatedOrder,
      source
    });

    await sendEnrollmentEmail({
      user: populatedOrder.user,
      course: populatedOrder.course,
      invoiceNumber: populatedOrder.invoiceNumber
    });
  }

  if (shouldFulfillProduct && populatedOrder.product) {
    const productUpdates = {
      $inc: {
        soldCount: populatedOrder.quantity || 1
      }
    };

    if (populatedOrder.product.inventory?.track) {
      productUpdates.$inc['inventory.quantity'] = -Math.max(1, populatedOrder.quantity || 1);
    }

    await Product.findByIdAndUpdate(populatedOrder.product._id, productUpdates);
    populatedOrder.fulfilledAt = new Date();
  }

  populatedOrder.status = 'paid';
  if (populatedOrder.itemType === 'course') {
    populatedOrder.accessGrantedAt = populatedOrder.accessGrantedAt || new Date();
  }
  await populatedOrder.save();

  const cartLookup = {
    user: populatedOrder.user._id,
    itemType: populatedOrder.itemType || 'course',
    status: 'active'
  };
  if (populatedOrder.itemType === 'product') {
    cartLookup.product = populatedOrder.product?._id;
  } else {
    cartLookup.course = populatedOrder.course?._id;
  }

  await CartItem.updateMany(
    cartLookup,
    {
      $set: {
        status: 'converted',
        order: populatedOrder._id,
        convertedAt: new Date()
      }
    }
  );

  await createOrderEarnings({ order: populatedOrder });

  return populatedOrder;
};

const verifyPaystackSignature = (req) => {
  if (!env.payments.paystackWebhookSecret) return;

  const signature = req.headers['x-paystack-signature'];
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha512', env.payments.paystackWebhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expected) {
    throw new ApiError(401, 'Invalid Paystack webhook signature');
  }
};

const parseStripeEvent = (req) => {
  if (!env.payments.stripeWebhookSecret) return req.body;
  if (!stripe) throw new ApiError(400, 'Stripe is not configured');

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    throw new ApiError(401, 'Missing Stripe webhook signature');
  }

  try {
    return stripe.webhooks.constructEvent(
      req.rawBody || JSON.stringify(req.body),
      signature,
      env.payments.stripeWebhookSecret
    );
  } catch {
    throw new ApiError(401, 'Invalid Stripe webhook signature');
  }
};

const webhookPaymentRef = ({ provider, event }) => {
  if (provider === 'paystack') {
    return event?.data?.reference;
  }

  if (provider === 'stripe') {
    const object = event?.data?.object || {};
    if (event?.type === 'checkout.session.completed') return object.id;
    return object.payment_intent || object.id;
  }

  return null;
};

const isSuccessWebhook = ({ provider, event }) => {
  if (provider === 'paystack') return event?.event === 'charge.success';

  if (provider === 'stripe') {
    return ['payment_intent.succeeded', 'charge.succeeded', 'checkout.session.completed'].includes(
      event?.type
    );
  }

  return false;
};

export const checkoutCourse = asyncHandler(async (req, res) => {
  const { courseId, provider = 'stripe', couponCode, termsAccepted, country } = req.body;

  if (!termsAccepted) {
    throw new ApiError(400, 'Terms must be accepted before payment');
  }

  if (!mongoose.isValidObjectId(courseId)) {
    throw new ApiError(400, 'Valid course id is required');
  }

  const course = await Course.findById(courseId);

  if (!course || course.status !== 'published') {
    throw new ApiError(404, 'Course not found');
  }

  const alreadyUnlocked = await hasCourseAccess({ user: req.user, courseId: course._id });
  if (alreadyUnlocked) {
    throw new ApiError(409, 'Course is already unlocked');
  }

  const providerOverride = course.paymentProviderOverrides?.find(
    (item) => item.country?.toLowerCase() === country?.toLowerCase()
  );
  const selectedProvider = providerOverride?.provider || provider;
  if (!['stripe', 'paystack', 'mock'].includes(selectedProvider)) {
    throw new ApiError(400, 'Unsupported payment provider');
  }

  const amount = applyCoupon(course.price, couponCode);
  const invoiceNumber = createInvoiceNumber();
  const invoice = createInvoice({
    invoiceNumber,
    user: req.user,
    itemName: course.title,
    amount,
    currency: course.currency
  });

  const order = await Order.create({
    user: req.user._id,
    itemType: 'course',
    course: course._id,
    quantity: 1,
    amount,
    currency: course.currency,
    provider: amount <= 0 ? 'mock' : selectedProvider,
    status: amount <= 0 ? 'verified' : 'pending',
    paymentRef: amount <= 0 ? `free_${Date.now()}` : `pending_${Date.now()}`,
    couponCode,
    invoiceNumber,
    invoice
  });

  if (amount <= 0) {
    const paidOrder = await completeVerifiedOrder({
      order,
      rawPaymentEvent: { type: 'free_course' },
      source: 'free_course'
    });

    return res.status(201).json({
      order: paidOrder,
      payment: { provider: 'mock', status: 'paid', verificationRequired: false }
    });
  }

  const payment = await createPayment({
    provider: selectedProvider,
    amount,
    currency: course.currency,
    email: req.user.email,
    description: `PlaneForge course: ${course.title}`,
    successUrl: `${env.clientUrl}/checkout/complete?order=${order._id}`,
    cancelUrl: `${env.clientUrl}/checkout/${course.slug}`,
    metadata: {
      userId: req.user._id.toString(),
      courseId: course._id.toString(),
      orderId: order._id.toString()
    }
  });

  order.provider = payment.provider;
  order.status = payment.status;
  order.paymentRef = payment.paymentRef;
  await order.save();

  res.status(201).json({
    order,
    payment,
    verificationRequired: true,
    mockVerificationAvailable: payment.provider === 'mock'
  });
});

export const checkoutProduct = asyncHandler(async (req, res) => {
  const { productId, provider = 'stripe', couponCode, termsAccepted, quantity = 1 } = req.body;

  if (!termsAccepted) {
    throw new ApiError(400, 'Terms must be accepted before payment');
  }

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'Valid product id is required');
  }

  const product = await Product.findById(productId);
  if (!product || product.status !== 'published') {
    throw new ApiError(404, 'Product not found');
  }

  const safeQuantity = Math.max(1, Number(quantity || 1));
  if (product.inventory?.track && product.inventory.quantity < safeQuantity) {
    throw new ApiError(409, 'Product is out of stock');
  }

  const selectedProvider = ['stripe', 'paystack', 'mock'].includes(provider) ? provider : 'stripe';
  const subtotal = product.price * safeQuantity;
  const amount = applyCoupon(subtotal, couponCode);
  const invoiceNumber = createInvoiceNumber();
  const invoice = createInvoice({
    invoiceNumber,
    user: req.user,
    itemName: product.title,
    amount,
    currency: product.currency
  });

  const order = await Order.create({
    user: req.user._id,
    itemType: 'product',
    product: product._id,
    quantity: safeQuantity,
    amount,
    currency: product.currency,
    provider: amount <= 0 ? 'mock' : selectedProvider,
    status: amount <= 0 ? 'verified' : 'pending',
    paymentRef: amount <= 0 ? `free_product_${Date.now()}` : `pending_product_${Date.now()}`,
    couponCode,
    invoiceNumber,
    invoice
  });

  if (amount <= 0) {
    const paidOrder = await completeVerifiedOrder({
      order,
      rawPaymentEvent: { type: 'free_product' },
      source: 'free_product'
    });

    return res.status(201).json({
      order: paidOrder,
      payment: { provider: 'mock', status: 'paid', verificationRequired: false }
    });
  }

  const payment = await createPayment({
    provider: selectedProvider,
    amount,
    currency: product.currency,
    email: req.user.email,
    description: `PlaneForge product: ${product.title}`,
    successUrl: `${env.clientUrl}/checkout/complete?order=${order._id}`,
    cancelUrl: `${env.clientUrl}/checkout/product/${product.slug}`,
    metadata: {
      userId: req.user._id.toString(),
      productId: product._id.toString(),
      orderId: order._id.toString()
    }
  });

  order.provider = payment.provider;
  order.status = payment.status;
  order.paymentRef = payment.paymentRef;
  await order.save();

  res.status(201).json({
    order,
    payment,
    verificationRequired: true,
    mockVerificationAvailable: payment.provider === 'mock'
  });
});

export const verifyMockPayment = asyncHandler(async (req, res) => {
  if (!env.payments.mock) {
    throw new ApiError(404, 'Mock payment verification is disabled');
  }

  const { orderId } = req.body;
  const order = await Order.findOne({
    _id: orderId,
    user: req.user._id,
    provider: 'mock',
    status: { $in: ['pending', 'payment_initialized', 'verified'] }
  });

  if (!order) {
    throw new ApiError(404, 'Mock order not found');
  }

  const paidOrder = await completeVerifiedOrder({
    order,
    rawPaymentEvent: { type: 'mock.payment_verified' },
    source: 'mock_verification'
  });

  res.json({ order: paidOrder, access: 'granted' });
});

export const handlePaymentWebhook = asyncHandler(async (req, res) => {
  const { provider } = req.params;

  if (!['stripe', 'paystack'].includes(provider)) {
    throw new ApiError(400, 'Unsupported payment webhook provider');
  }

  const event = provider === 'stripe' ? parseStripeEvent(req) : req.body;
  if (provider === 'paystack') verifyPaystackSignature(req);

  if (!isSuccessWebhook({ provider, event })) {
    return res.json({ received: true, ignored: true });
  }

  const paymentRef = webhookPaymentRef({ provider, event });
  if (!paymentRef) {
    throw new ApiError(400, 'Payment reference missing from webhook');
  }

  const order = await Order.findOne({ provider, paymentRef });
  if (!order) {
    throw new ApiError(404, 'Order not found for payment reference');
  }

  const paidOrder = await completeVerifiedOrder({
    order,
    rawPaymentEvent: event,
    source: 'payment_webhook'
  });

  res.json({ received: true, orderId: paidOrder._id, access: 'granted' });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('course', 'title slug thumbnail instructorName')
    .populate('product', 'title slug thumbnail sku')
    .sort({ createdAt: -1 });

  res.json({ orders });
});
