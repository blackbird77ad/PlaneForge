import { Router } from 'express';
import {
  addCartItem,
  completeLesson,
  dashboard,
  listCartItems,
  removeCartItem,
  saveLessonProgress,
  updateProfile
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

export const userRoutes = Router();

userRoutes.get('/dashboard', protect, dashboard);
userRoutes.patch('/profile', protect, updateProfile);
userRoutes.get('/cart', protect, listCartItems);
userRoutes.post('/cart', protect, addCartItem);
userRoutes.delete('/cart/:id', protect, removeCartItem);
userRoutes.patch('/progress/:courseId/lessons/:lessonId', protect, saveLessonProgress);
userRoutes.post('/progress/:courseId/lessons', protect, completeLesson);
