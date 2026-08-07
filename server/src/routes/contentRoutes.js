import { Router } from 'express';
import {
  homepage,
  listArticles,
  submitContactInquiry,
  subscribeNewsletter
} from '../controllers/contentController.js';

export const contentRoutes = Router();

contentRoutes.get('/homepage', homepage);
contentRoutes.get('/articles', listArticles);
contentRoutes.post('/newsletter', subscribeNewsletter);
contentRoutes.post('/contact', submitContactInquiry);
