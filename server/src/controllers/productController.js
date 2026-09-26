import { Readable } from 'node:stream';
import { DigitalEntitlement } from '../models/DigitalEntitlement.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isProductSaleActive, productPricing, stockSummary } from '../utils/productPricing.js';

const sortMap = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  popular: { soldCount: -1 },
  priceAsc: { price: 1 },
  priceDesc: { price: -1 },
  alphabetical: { title: 1 },
  stock: { 'inventory.quantity': -1 },
  updated: { updatedAt: -1 }
};

const publicAsset = (asset, product, includeAccess = false) => {
  const data = asset.toObject ? asset.toObject() : asset;
  return {
    _id: data._id,
    label: data.label,
    type: data.type,
    fileName: data.fileName,
    size: data.size,
    downloadable: data.downloadable !== false,
    ...(includeAccess ? { downloadPath: `/api/products/${product.slug}/assets/${data._id}/download` } : {})
  };
};

export const publicProduct = (product, { includeDigitalAccess = false } = {}) => {
  const data = product.toObject ? product.toObject() : product;

  return {
    ...data,
    pricing: productPricing(data),
    stock: stockSummary(data),
    saleState: {
      hotSale: Boolean(data.isHotSale),
      featured: Boolean(data.isFeatured),
      flashSaleActive: isProductSaleActive(data.flashSale)
    },
    digitalAssets: (data.digitalAssets || []).map((asset) => publicAsset(asset, data, includeDigitalAccess))
  };
};

const hasDigitalEntitlement = async ({ userId, productId }) =>
  DigitalEntitlement.findOne({
    user: userId,
    product: productId,
    status: 'active',
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }]
  });

export const listProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    type,
    productType,
    sort = 'newest',
    featured,
    hotSale,
    sale,
    availability,
    page = 1,
    limit = 12
  } = req.query;
  const query = { status: 'published' };
  const andConditions = [];

  if (search) {
    const regex = new RegExp(search, 'i');
    andConditions.push({ $or: [{ title: regex }, { description: regex }, { category: regex }, { sku: regex }] });
  }

  if (category) query.category = category;
  if (type || productType) query.productType = type || productType;
  if (featured === 'true') query.isFeatured = true;
  if (hotSale === 'true') query.isHotSale = true;
  if (sale === 'flash') {
    const now = new Date();
    query['flashSale.enabled'] = true;
    andConditions.push(
      { $or: [{ 'flashSale.startsAt': { $exists: false } }, { 'flashSale.startsAt': null }, { 'flashSale.startsAt': { $lte: now } }] },
      { $or: [{ 'flashSale.endsAt': { $exists: false } }, { 'flashSale.endsAt': null }, { 'flashSale.endsAt': { $gte: now } }] }
    );
  }
  if (availability === 'inStock') {
    andConditions.push({ $or: [{ productType: 'digital' }, { 'inventory.track': { $ne: true } }, { 'inventory.quantity': { $gt: 0 } }] });
  }
  if (availability === 'outOfStock') {
    query.productType = 'physical';
    query['inventory.track'] = true;
    query['inventory.quantity'] = { $lte: 0 };
  }
  if (req.query.price === 'under50') query.price = { $lte: 50 };
  if (req.query.price === 'under100') query.price = { $lte: 100 };
  if (req.query.price === 'over100') query.price = { $gte: 100 };
  if (andConditions.length) query.$and = andConditions;

  const safeLimit = Math.min(Number(limit) || 12, 24);
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * safeLimit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(safeLimit),
    Product.countDocuments(query)
  ]);

  res.json({
    products: products.map((product) => publicProduct(product)),
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total,
      pages: Math.max(Math.ceil(total / safeLimit), 1)
    }
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: 'published' });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.json({ product: publicProduct(product) });
});

export const getProductAccess = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: { $ne: 'archived' } });

  if (!product || product.productType !== 'digital') {
    throw new ApiError(404, 'Digital product not found');
  }

  const entitlement = await hasDigitalEntitlement({ userId: req.user._id, productId: product._id });
  if (!entitlement && req.user.role !== 'admin') {
    throw new ApiError(403, 'Purchase this digital product before accessing files');
  }

  if (entitlement) {
    entitlement.accessCount += 1;
    entitlement.lastAccessedAt = new Date();
    await entitlement.save();
  }

  res.json({
    product: publicProduct(product, { includeDigitalAccess: true }),
    entitlement
  });
});

export const downloadDigitalAsset = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, status: { $ne: 'archived' } });

  if (!product || product.productType !== 'digital') {
    throw new ApiError(404, 'Digital product not found');
  }

  const entitlement = await hasDigitalEntitlement({ userId: req.user._id, productId: product._id });
  if (!entitlement && req.user.role !== 'admin') {
    throw new ApiError(403, 'Purchase this digital product before downloading files');
  }

  const asset = product.digitalAssets.id(req.params.assetId);
  if (!asset?.url) {
    throw new ApiError(404, 'Digital asset not found');
  }

  if (entitlement) {
    entitlement.accessCount += 1;
    entitlement.lastAccessedAt = new Date();
    await entitlement.save();
  }

  const fileName = asset.fileName || asset.label || `${product.slug}-asset`;
  res.setHeader('Content-Disposition', `attachment; filename="${String(fileName).replaceAll('"', '')}"`);

  if (/^https?:\/\//i.test(asset.url)) {
    const upstream = await fetch(asset.url);
    if (!upstream.ok || !upstream.body) {
      throw new ApiError(502, 'Digital asset could not be retrieved');
    }
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    return Readable.fromWeb(upstream.body).pipe(res);
  }

  return res.redirect(asset.url);
});
