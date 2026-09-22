import { Product } from '../models/Product.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const sortMap = {
  newest: { createdAt: -1 },
  popular: { soldCount: -1 },
  priceAsc: { price: 1 },
  priceDesc: { price: -1 },
  alphabetical: { title: 1 }
};

export const listProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    type,
    productType,
    sort = 'newest',
    featured,
    page = 1,
    limit = 12
  } = req.query;
  const query = { status: 'published' };

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ title: regex }, { description: regex }, { category: regex }, { sku: regex }];
  }

  if (category) query.category = category;
  if (type || productType) query.productType = type || productType;
  if (featured === 'true') query.isFeatured = true;

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
    products,
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

  res.json({ product });
});
