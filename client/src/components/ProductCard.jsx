import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Box, CircuitBoard, PackageCheck, ShoppingCart } from 'lucide-react';
import { addCartItem } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value || 0));

const stockLabel = (product) => {
  if (product?.stock?.label) return product.stock.label;
  if (product?.productType === 'digital') return 'Digital delivery';
  if (!product?.inventory?.track) return 'Available';
  const quantity = Number(product.inventory.quantity || 0);
  if (quantity <= 0) return 'Out of stock';
  if (quantity <= 5) return `${quantity} left`;
  return 'In stock';
};

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const safeProduct = product || {};
  const title = safeProduct.title || 'PlaneForge product';
  const slug = safeProduct.slug || safeProduct._id || safeProduct.id || 'products';
  const pricing = safeProduct.pricing || {
    finalPrice: safeProduct.price,
    originalPrice: safeProduct.price,
    onSale: false,
    percentageOff: 0
  };
  const unavailable = safeProduct.stock ? !safeProduct.stock.canPurchase : stockLabel(safeProduct) === 'Out of stock';
  const [busy, setBusy] = useState(false);

  const addToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/products/${slug}` } });
      return;
    }
    setBusy(true);
    try {
      await addCartItem({ productId: safeProduct._id || safeProduct.id, quantity: 1, source: 'product_card' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="course-card product-card">
      <div className="product-card-media">
      <img
        src={safeProduct.thumbnail || safeProduct.images?.[0] || '/favicon.png'}
        alt={`${title} preview`}
        loading="lazy"
        decoding="async"
      />
        <div className="product-card-badges">
          {pricing.onSale && <span>{pricing.percentageOff}% OFF</span>}
          {safeProduct.saleState?.hotSale || safeProduct.isHotSale ? <span>Hot Sale</span> : null}
          {safeProduct.saleState?.featured || safeProduct.isFeatured ? <span>Featured</span> : null}
        </div>
      </div>
      <div className="course-card-body">
        <div className="meta-row">
          <span>{safeProduct.category || 'Hardware Product'}</span>
          <span>{safeProduct.productType === 'digital' ? 'Digital' : 'Physical'}</span>
        </div>
        <h3>{title}</h3>
        <p>{safeProduct.description || 'A practical PlaneForge hardware product for PCB builders.'}</p>
        <div className="course-facts">
          <span>
            {safeProduct.productType === 'digital' ? <Box size={16} /> : <CircuitBoard size={16} />}
            {safeProduct.sku || 'PlaneForge'}
          </span>
          <span>
            <PackageCheck size={16} />
            {stockLabel(safeProduct)}
          </span>
        </div>
        <div className="card-footer">
          <strong>
            {pricing.isFree ? 'Free' : money(pricing.finalPrice, safeProduct.currency)}
            {pricing.onSale && <small>{money(pricing.originalPrice, safeProduct.currency)}</small>}
          </strong>
          <button className="button ghost small" type="button" onClick={addToCart} disabled={busy || unavailable}>
            <ShoppingCart size={16} />
            {busy ? 'Adding' : 'Add'}
          </button>
          <Link className="button ghost small" to={`/products/${slug}`}>
            View Product
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
};
