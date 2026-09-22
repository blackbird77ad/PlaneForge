import { Router } from 'express';
import { getProduct, listProducts } from '../controllers/productController.js';

export const productRoutes = Router();

productRoutes.get('/', listProducts);
productRoutes.get('/:slug', getProduct);
