import { Router } from 'express';
import {
  getPublicCareer,
  listPublicCareers,
  submitCareerApplication
} from '../controllers/careerController.js';

export const careerRoutes = Router();

careerRoutes.get('/', listPublicCareers);
careerRoutes.get('/:slug', getPublicCareer);
careerRoutes.post('/:slug/apply', submitCareerApplication);
