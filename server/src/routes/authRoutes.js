import { Router } from 'express';
import { getMe, login, register } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/me', protect, getMe);
