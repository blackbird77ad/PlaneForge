import { Router } from 'express';
import {
  getMe,
  login,
  logout,
  register,
  resendLoginCode,
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
  verifyLogin
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/verification/resend', resendLoginCode);
authRoutes.post('/verify-login', verifyLogin);
authRoutes.post('/password-reset/request', requestPasswordReset);
authRoutes.post('/password-reset/verify', verifyPasswordResetCode);
authRoutes.post('/password-reset/complete', resetPassword);
authRoutes.post('/logout', protect, logout);
authRoutes.get('/me', protect, getMe);
