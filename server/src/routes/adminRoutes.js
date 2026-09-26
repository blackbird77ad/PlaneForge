import { Router } from 'express';
import {
  archiveArticle,
  archiveProduct,
  createArticle,
  createExpense,
  createProduct,
  createUser,
  grantEnrollment,
  listActivity,
  listInquiries,
  listConsultations,
  listContent,
  listEarnings,
  listExpenses,
  listPayments,
  listProductsAdmin,
  listReviews,
  listUsers,
  moderateReview,
  overview,
  updateArticle,
  updateConsultation,
  updateExpense,
  updateInquiry,
  updatePayment,
  updateProduct,
  updateUser,
} from '../controllers/adminController.js';
import {
  createCareerPositionAdmin,
  duplicateCareerPositionAdmin,
  getCareerDocumentAdmin,
  listCareerApplicationsAdmin,
  listCareerPositionsAdmin,
  updateCareerApplicationAdmin,
  updateCareerPositionAdmin
} from '../controllers/careerController.js';
import { allowRoles, protect } from '../middleware/auth.js';

export const adminRoutes = Router();

adminRoutes.use(protect, allowRoles('admin'));
adminRoutes.get('/overview', overview);
adminRoutes.get('/activity', listActivity);
adminRoutes.get('/users', listUsers);
adminRoutes.post('/users', createUser);
adminRoutes.patch('/users/:id', updateUser);
adminRoutes.post('/users/:id/enrollments', grantEnrollment);
adminRoutes.get('/payments', listPayments);
adminRoutes.patch('/payments/:id', updatePayment);
adminRoutes.get('/consultations', listConsultations);
adminRoutes.patch('/consultations/:id', updateConsultation);
adminRoutes.get('/expenses', listExpenses);
adminRoutes.post('/expenses', createExpense);
adminRoutes.patch('/expenses/:id', updateExpense);
adminRoutes.get('/earnings', listEarnings);
adminRoutes.get('/content', listContent);
adminRoutes.get('/reviews', listReviews);
adminRoutes.patch('/reviews/:courseId/:reviewId', moderateReview);
adminRoutes.get('/products', listProductsAdmin);
adminRoutes.post('/products', createProduct);
adminRoutes.patch('/products/:id', updateProduct);
adminRoutes.delete('/products/:id', archiveProduct);
adminRoutes.get('/careers/positions', listCareerPositionsAdmin);
adminRoutes.post('/careers/positions', createCareerPositionAdmin);
adminRoutes.patch('/careers/positions/:id', updateCareerPositionAdmin);
adminRoutes.post('/careers/positions/:id/duplicate', duplicateCareerPositionAdmin);
adminRoutes.get('/careers/applications', listCareerApplicationsAdmin);
adminRoutes.patch('/careers/applications/:id', updateCareerApplicationAdmin);
adminRoutes.get('/careers/applications/:id/documents/:documentId', getCareerDocumentAdmin);
adminRoutes.post('/articles', createArticle);
adminRoutes.patch('/articles/:id', updateArticle);
adminRoutes.delete('/articles/:id', archiveArticle);
adminRoutes.get('/inquiries', listInquiries);
adminRoutes.patch('/inquiries/:id', updateInquiry);
