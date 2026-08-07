import { Router } from 'express';
import {
  completeLesson,
  dashboard,
  saveLessonProgress,
  updateProfile
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

export const userRoutes = Router();

userRoutes.get('/dashboard', protect, dashboard);
userRoutes.patch('/profile', protect, updateProfile);
userRoutes.patch('/progress/:courseId/lessons/:lessonId', protect, saveLessonProgress);
userRoutes.post('/progress/:courseId/lessons', protect, completeLesson);
