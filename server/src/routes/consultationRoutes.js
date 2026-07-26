import { Router } from 'express';
import {
  bookConsultation,
  listConsultants,
  listMyConsultations
} from '../controllers/consultationController.js';
import { protect } from '../middleware/auth.js';

export const consultationRoutes = Router();

consultationRoutes.get('/consultants', listConsultants);
consultationRoutes.post('/book', protect, bookConsultation);
consultationRoutes.get('/mine', protect, listMyConsultations);
