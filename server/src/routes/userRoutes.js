import { Router } from 'express';
import {
  addCartItem,
  completeLesson,
  dashboard,
  listMyEarnings,
  listCartItems,
  removeCartItem,
  confirmProfileChange,
  requestProfileChange,
  saveLessonProgress,
  updateProfile,
  withdrawEarning
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

export const userRoutes = Router();

userRoutes.get('/dashboard', protect, dashboard);
userRoutes.patch('/profile', protect, updateProfile);
userRoutes.post('/profile/change-request', protect, requestProfileChange);
userRoutes.post('/profile/change-confirm', protect, confirmProfileChange);
userRoutes.get('/earnings', protect, listMyEarnings);
userRoutes.post('/earnings/:id/withdraw', protect, withdrawEarning);
userRoutes.get('/cart', protect, listCartItems);
userRoutes.post('/cart', protect, addCartItem);
userRoutes.delete('/cart/:id', protect, removeCartItem);
userRoutes.patch('/progress/:courseId/lessons/:lessonId', protect, saveLessonProgress);
userRoutes.post('/progress/:courseId/lessons', protect, completeLesson);
