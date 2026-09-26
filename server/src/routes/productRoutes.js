import { Router } from 'express';
import { downloadDigitalAsset, getProduct, getProductAccess, listProducts } from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';

export const productRoutes = Router();

productRoutes.get('/', listProducts);
productRoutes.get('/:slug/access', protect, getProductAccess);
productRoutes.get('/:slug/assets/:assetId/download', protect, downloadDigitalAsset);
productRoutes.get('/:slug', getProduct);
