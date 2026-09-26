import mongoose from 'mongoose';
import Stripe from 'stripe';
import { env } from '../config/env.js';
import { CartItem } from '../models/CartItem.js';
import { Course } from '../models/Course.js';
import { DigitalEntitlement } from '../models/DigitalEntitlement.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { grantCourseAccess, hasCourseAccess } from '../services/accessService.js';
import { sendEnrollmentEmail } from '../services/emailService.js';
import { createInvoice, createInvoiceNumber } from '../services/invoiceService.js';
import { createPayment } from '../services/paymentService.js';
import { createOrderEarnings } from '../services/revenueService.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { coursePricing } from '../utils/coursePricing.js';
import { productPricing, stockSummary } from '../utils/productPricing.js';

const stripe = env.payments.stripeSecretKey ? new Stripe(env.payments.stripeSecretKey) : null;

const applyCoupon = (price, couponCode) => {
  if (!couponCode) return price;
  if (couponCode.toUpperCase() === 'FORGE10') return Number((price * 0.9).toFixed(2));
  return price;
};

const cleanShippingAddress = (address = {}) => ({
  fullName: String(address.fullName || '').trim(),
  phone: String(address.phone || '').trim(),
  addressLine1: String(address.addressLine1 || '').trim(),
  addressLine2: String(address.addressLine2 || '').trim(),
  city: String(address.city || '').trim(),
  region: String(address.region || '').trim(),
  country: String(address.country || '').trim(),
  postalCode: String(address.postalCode || '').trim()
});

const assertShippingAddress = (address = {}) => {
  const shippingAddress = cleanShippingAddress(address);
  const missing = ['fullName', 'phone', 'addressLine1', 'city', 'country'].filter((key) => !shippingAddress[key]);
  if (missing.length) {
    throw new ApiError(400, 'Shipping name, phone, address, city, and country are required');
  }

  return shippingAddress;
};

const shouldShipProduct = (product) => product?.productType !== 'digital' && product?.shipping?.requiresShipping !== false;

const grantDigitalProductAccess = async ({ order, source }) => {
  const entitlement = await DigitalEntitlement.findOneAndUpdate(
    { user: order.user._id, product: order.product._id },
    {
      $set: {
        user: order.user._id,
        product: order.product._id,
        order: order._id,
        status: 'active',
        source,
        grantedAt: new Date(),
        revokedAt: undefined,
        revokeReason: undefined
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  order.accessGrantedAt = order.accessGrantedAt || new Date();
  order.fulfilledAt = order.fulfilledAt || new Date();
  order.digitalFulfillmentStatus = 'ready';
  order.fulfillmentStatus = 'digital_ready';
  return entitlement;
};

const fulfillPhysicalProduct = async (order) => {
  const quantity = Math.max(1, Number(order.quantity || 1));
  const product = order.product;
  const updates = {
    $inc: {
      soldCount: quantity
    }
  };

  if (product.inventory?.track) {
    updates.$inc['inventory.quantity'] = -quantity;
    const lookup = {
      _id: product._id,
      ...(product.inventory.allowBackorder ? {} : { 'inventory.quantity': { $gte: quantity } })
    };
    const updated = await Product.findOneAndUpdate(lookup, updates, { new: true });
    if (!updated) {
      order.fulfillmentStatus = 'inventory_exception';
      return false;
    }
  } else {
    await Product.findByIdAndUpdate(product._id, updates);
  }

  order.fulfilledAt = order.fulfilledAt || new Date();
  order.fulfillmentStatus = 'pending';
  order.digitalFulfillmentStatus = 'not_required';
  return true;
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
    if (populatedOrder.product.productType === 'digital') {
      await grantDigitalProductAccess({ order: populatedOrder, source });
    } else {
      await fulfillPhysicalProduct(populatedOrder);
    }
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
  if (provider === 'stripe') {
    const object = event?.data?.object || {};
    if (event?.type === 'checkout.session.completed') return object.id;
    return object.payment_intent || object.id;
  }

  return null;
};

const isSuccessWebhook = ({ provider, event }) => {
  if (provider === 'stripe') {
    return ['payment_intent.succeeded', 'charge.succeeded', 'checkout.session.completed'].includes(
      event?.type
    );
  }

  return false;
};

export const checkoutCourse = asyncHandler(async (req, res) => {
  const { courseId, provider = 'stripe', termsAccepted, country } = req.body;

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

  const selectedProvider = provider;
  if (selectedProvider !== 'stripe') {
    throw new ApiError(400, 'Unsupported payment provider');
  }

  const pricing = coursePricing(course);
  const amount = pricing.finalPrice;
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
    provider: selectedProvider,
    status: amount <= 0 ? 'verified' : 'pending',
    paymentRef: amount <= 0 ? `free_${Date.now()}` : `pending_${Date.now()}`,
    couponCode: pricing.discount?.label,
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
      payment: { provider: selectedProvider, status: 'paid', verificationRequired: false },
      pricing
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
      orderId: order._id.toString(),
      finalPrice: String(amount),
      originalPrice: String(pricing.originalPrice)
    }
  });

  order.provider = payment.provider;
  order.status = payment.status;
  order.paymentRef = payment.paymentRef;
  await order.save();

  res.status(201).json({
    order,
    payment,
    pricing,
    verificationRequired: true
  });
});

export const checkoutProduct = asyncHandler(async (req, res) => {
  const { productId, provider = 'stripe', termsAccepted, quantity = 1, shippingAddress: rawShippingAddress } = req.body;

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
  const stock = stockSummary(product);
  if (!stock.canPurchase) {
    throw new ApiError(409, 'Product is out of stock');
  }
  if (product.productType !== 'digital' && product.inventory?.track && !product.inventory.allowBackorder && product.inventory.quantity < safeQuantity) {
    throw new ApiError(409, 'Requested quantity is not available');
  }

  const selectedProvider = provider;
  if (selectedProvider !== 'stripe') {
    throw new ApiError(400, 'Unsupported payment provider');
  }
  const shippingAddress = shouldShipProduct(product) ? assertShippingAddress(rawShippingAddress) : undefined;
  const pricing = productPricing(product);
  const originalAmount = Number((pricing.originalPrice * safeQuantity).toFixed(2));
  const amount = Number((pricing.finalPrice * safeQuantity).toFixed(2));
  const discountAmount = Number((pricing.discountAmount * safeQuantity).toFixed(2));
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
    productType: product.productType,
    quantity: safeQuantity,
    originalAmount,
    discountAmount,
    unitPrice: pricing.finalPrice,
    productSnapshot: {
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      productType: product.productType,
      thumbnail: product.thumbnail,
      category: product.category
    },
    pricingSnapshot: pricing,
    shippingAddress,
    fulfillmentStatus: product.productType === 'digital' ? 'not_required' : 'pending',
    digitalFulfillmentStatus: product.productType === 'digital' ? 'pending' : 'not_required',
    items: [
      {
        itemType: 'product',
        product: product._id,
        title: product.title,
        slug: product.slug,
        sku: product.sku,
        productType: product.productType,
        quantity: safeQuantity,
        originalUnitPrice: pricing.originalPrice,
        unitPrice: pricing.finalPrice,
        discountAmount: pricing.discountAmount,
        lineTotal: amount,
        currency: product.currency
      }
    ],
    amount,
    currency: product.currency,
    provider: selectedProvider,
    status: amount <= 0 ? 'verified' : 'pending',
    paymentRef: amount <= 0 ? `free_product_${Date.now()}` : `pending_product_${Date.now()}`,
    couponCode: pricing.sale?.label,
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
      payment: { provider: selectedProvider, status: 'paid', verificationRequired: false },
      pricing
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
      orderId: order._id.toString(),
      productType: product.productType,
      finalPrice: String(amount),
      originalPrice: String(originalAmount)
    }
  });

  order.provider = payment.provider;
  order.status = payment.status;
  order.paymentRef = payment.paymentRef;
  await order.save();

  res.status(201).json({
    order,
    payment,
    pricing,
    verificationRequired: true
  });
});

export const handlePaymentWebhook = asyncHandler(async (req, res) => {
  const { provider } = req.params;

  if (provider !== 'stripe') {
    throw new ApiError(400, 'Unsupported payment webhook provider');
  }

  const event = parseStripeEvent(req);

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
    .populate('product', 'title slug thumbnail sku productType')
    .sort({ createdAt: -1 });

  res.json({ orders });
});
