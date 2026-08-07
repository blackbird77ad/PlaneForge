import { Router } from 'express';
import {
  checkoutCourse,
  handlePaymentWebhook,
  listMyOrders,
  verifyMockPayment
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

export const orderRoutes = Router();

orderRoutes.post('/checkout', protect, checkoutCourse);
orderRoutes.post('/mock-verify', protect, verifyMockPayment);
orderRoutes.post('/webhooks/:provider', handlePaymentWebhook);
orderRoutes.get('/mine', protect, listMyOrders);
