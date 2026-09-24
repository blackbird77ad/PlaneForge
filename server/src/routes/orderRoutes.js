import { Router } from 'express';
import {
  checkoutCourse,
  checkoutProduct,
  handlePaymentWebhook,
  listMyOrders
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

export const orderRoutes = Router();

orderRoutes.post('/checkout', protect, checkoutCourse);
orderRoutes.post('/checkout-product', protect, checkoutProduct);
orderRoutes.post('/webhooks/:provider', handlePaymentWebhook);
orderRoutes.get('/mine', protect, listMyOrders);
