import { Router } from 'express';
import { completeLesson, dashboard, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

export const userRoutes = Router();

userRoutes.get('/dashboard', protect, dashboard);
userRoutes.patch('/profile', protect, updateProfile);
userRoutes.post('/progress/:courseId/lessons', protect, completeLesson);
