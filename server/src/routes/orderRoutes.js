import { Router } from 'express';
import { checkoutCourse, listMyOrders } from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

export const orderRoutes = Router();

orderRoutes.post('/checkout', protect, checkoutCourse);
orderRoutes.get('/mine', protect, listMyOrders);
