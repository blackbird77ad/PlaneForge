import { Router } from 'express';
import {
  archiveArticle,
  createArticle,
  grantEnrollment,
  listInquiries,
  listConsultations,
  listContent,
  listPayments,
  listSettings,
  listUsers,
  overview,
  updateArticle,
  updateConsultation,
  updateInquiry,
  updatePayment,
  updateUser,
  upsertSetting
} from '../controllers/adminController.js';
import { allowRoles, protect } from '../middleware/auth.js';

export const adminRoutes = Router();

adminRoutes.use(protect, allowRoles('admin'));
adminRoutes.get('/overview', overview);
adminRoutes.get('/users', listUsers);
adminRoutes.patch('/users/:id', updateUser);
adminRoutes.post('/users/:id/enrollments', grantEnrollment);
adminRoutes.get('/payments', listPayments);
adminRoutes.patch('/payments/:id', updatePayment);
adminRoutes.get('/consultations', listConsultations);
adminRoutes.patch('/consultations/:id', updateConsultation);
adminRoutes.get('/content', listContent);
adminRoutes.post('/articles', createArticle);
adminRoutes.patch('/articles/:id', updateArticle);
adminRoutes.delete('/articles/:id', archiveArticle);
adminRoutes.get('/inquiries', listInquiries);
adminRoutes.patch('/inquiries/:id', updateInquiry);
adminRoutes.get('/settings', listSettings);
adminRoutes.put('/settings', upsertSetting);
