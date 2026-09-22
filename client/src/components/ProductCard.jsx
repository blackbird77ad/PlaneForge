import { Link } from 'react-router-dom';
import { ArrowRight, Box, CircuitBoard, PackageCheck } from 'lucide-react';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value || 0));

const stockLabel = (product) => {
  if (product?.productType === 'digital') return 'Digital delivery';
  if (!product?.inventory?.track) return 'Available';
  const quantity = Number(product.inventory.quantity || 0);
  if (quantity <= 0) return 'Out of stock';
  if (quantity <= 5) return `${quantity} left`;
  return 'In stock';
};

export const ProductCard = ({ product }) => {
  const safeProduct = product || {};
  const title = safeProduct.title || 'PlaneForge product';
  const slug = safeProduct.slug || safeProduct._id || safeProduct.id || 'products';

  return (
    <article className="course-card product-card">
      <img
        src={safeProduct.thumbnail || safeProduct.images?.[0] || '/favicon.png'}
        alt={`${title} preview`}
        loading="lazy"
        decoding="async"
      />
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
          <strong>{money(safeProduct.price, safeProduct.currency)}</strong>
          <Link className="button ghost small" to={`/products/${slug}`}>
            View Product
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
};
