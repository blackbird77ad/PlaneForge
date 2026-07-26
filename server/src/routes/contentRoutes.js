import { Router } from 'express';
import { homepage, listArticles, subscribeNewsletter } from '../controllers/contentController.js';

export const contentRoutes = Router();

contentRoutes.get('/homepage', homepage);
contentRoutes.get('/articles', listArticles);
contentRoutes.post('/newsletter', subscribeNewsletter);
