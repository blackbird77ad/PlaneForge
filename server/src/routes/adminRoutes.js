import { Router } from 'express';
import {
  listConsultations,
  listContent,
  listPayments,
  listUsers,
  overview,
  upsertSetting
} from '../controllers/adminController.js';
import { allowRoles, protect } from '../middleware/auth.js';

export const adminRoutes = Router();

adminRoutes.use(protect, allowRoles('admin'));
adminRoutes.get('/overview', overview);
adminRoutes.get('/users', listUsers);
adminRoutes.get('/payments', listPayments);
adminRoutes.get('/consultations', listConsultations);
adminRoutes.get('/content', listContent);
adminRoutes.put('/settings', upsertSetting);
