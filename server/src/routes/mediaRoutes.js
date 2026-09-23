import { Router } from 'express';
import { uploadImage } from '../controllers/mediaController.js';
import { protect } from '../middleware/auth.js';

export const mediaRoutes = Router();

mediaRoutes.use(protect);
mediaRoutes.post('/images', uploadImage);
