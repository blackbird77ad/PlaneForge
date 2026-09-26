import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  CheckCircle,
  CircuitBoard,
  CreditCard,
  Download,
  Hammer,
  PackageCheck,
  Send,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Truck
} from 'lucide-react';
import { addCartItem, downloadDigitalAsset, getProduct, getProductAccess, submitContactInquiry } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value || 0));

const stockLabel = (product) => {
  if (product?.stock?.label) return product.stock.label;
  if (product?.productType === 'digital') return 'Digital delivery';
  if (!product?.inventory?.track) return 'Available to order';
  const quantity = Number(product.inventory.quantity || 0);
  if (quantity <= 0) return 'Out of stock';
  if (quantity <= 5) return `${quantity} left`;
  return `${quantity} available`;
};

const isOutOfStock = (product) =>
  product?.stock ? !product.stock.canPurchase : product?.productType !== 'digital' &&
    product?.inventory?.track &&
    Number(product.inventory.quantity || 0) <= 0;

const requestInitial = (user) => ({
  name: user?.name || '',
  email: user?.email || '',
  organization: user?.profile?.organization || '',
  role: user?.title || '',
  projectUse: '',
  timeline: '',
  budget: '',
  message: ''
});

export const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading');
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');
  const [cartBusy, setCartBusy] = useState(false);
  const [requestForm, setRequestForm] = useState(() => requestInitial(user));
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestBusy, setRequestBusy] = useState(false);
  const [accessAssets, setAccessAssets] = useState([]);
  const [accessMessage, setAccessMessage] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessBusy, setAccessBusy] = useState('');

  useEffect(() => {
    setProduct(null);
    setStatus('loading');
    setSelectedImage('');

    getProduct(slug)
      .then((data) => {
        const nextProduct = data.product || null;
        setProduct(nextProduct);
        setSelectedImage(nextProduct?.thumbnail || nextProduct?.images?.[0] || '');
        setStatus(nextProduct ? 'ready' : 'not-found');
      })
      .catch(() => {
        setProduct(null);
        setStatus('not-found');
      });
  }, [slug]);

  useEffect(() => {
    setRequestForm((current) => ({
      ...current,
      name: current.name || user?.name || '',
      email: current.email || user?.email || '',
      organization: current.organization || user?.profile?.organization || '',
      role: current.role || user?.title || ''
    }));
  }, [user]);

  const galleryImages = useMemo(() => {
    const images = [product?.thumbnail, ...(product?.images || [])].filter(Boolean);
    return Array.from(new Set(images));
  }, [product]);

  if (status === 'loading') {
    return <main className="section page">Loading product...</main>;
  }

  if (!product) {
    return (
      <main className="section page">
        <div className="page-heading">
          <p className="eyebrow">Product not found</p>
          <h1>This PlaneForge product is not available</h1>
          <p>It may have moved, or the catalog may still be syncing.</p>
          <Link className="button primary" to="/products">
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  const quantityLimit = product.inventory?.track ? Math.max(1, Number(product.inventory.quantity || 1)) : 99;
  const safeQuantity = Math.min(Math.max(1, Number(quantity || 1)), quantityLimit);
  const unavailable = isOutOfStock(product);
  const image = selectedImage || product.thumbnail || galleryImages[0] || '/favicon.png';
  const pricing = product.pricing || {
    finalPrice: product.price,
    originalPrice: product.price,
    onSale: false,
    percentageOff: 0
  };
  const specs = Array.isArray(product.specifications) ? product.specifications.filter((item) => item.label || item.value) : [];

  const buyProduct = () => {
    const checkoutPath = `/checkout/product/${product.slug}`;

    if (!user) {
      navigate('/login', { state: { from: checkoutPath } });
      return;
    }

    navigate(checkoutPath, { state: { quantity: safeQuantity } });
  };

  const addProductToCart = async () => {
    setCartMessage('');
    setCartError('');

    if (!user) {
      navigate('/login', { state: { from: `/products/${product.slug}` } });
      return;
    }

    setCartBusy(true);
    try {
      await addCartItem({
        productId: product._id || product.id,
        quantity: safeQuantity,
        source: 'product_detail'
      });
      setCartMessage('Added to cart.');
    } catch (err) {
      setCartError(err.message);
    } finally {
      setCartBusy(false);
    }
  };

  const loadDigitalAccess = async () => {
    setAccessMessage('');
    setAccessError('');
    if (!user) {
      navigate('/login', { state: { from: `/products/${product.slug}` } });
      return;
    }
    setAccessBusy('access');
    try {
      const data = await getProductAccess(product.slug);
      setAccessAssets(data.product?.digitalAssets || []);
      setAccessMessage('Digital access verified.');
    } catch (err) {
      setAccessError(err.message);
    } finally {
      setAccessBusy('');
    }
  };

  const downloadAsset = async (asset) => {
    setAccessError('');
    setAccessBusy(asset._id);
    try {
      const { blob, fileName } = await downloadDigitalAsset({ slug: product.slug, assetId: asset._id });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || asset.fileName || asset.label || 'planeforge-download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setAccessError(err.message);
    } finally {
      setAccessBusy('');
    }
  };

  const updateRequest = (key, value) =>
    setRequestForm((current) => ({
      ...current,
      [key]: value
    }));

  const submitRequest = async (event) => {
    event.preventDefault();
    setRequestMessage('');
    setRequestError('');
    setRequestBusy(true);

    try {
      const details = [
        requestForm.message,
        `Reference product: ${product.title}`,
        product.sku ? `Reference SKU: ${product.sku}` : '',
        requestForm.projectUse ? `Project use: ${requestForm.projectUse}` : '',
        requestForm.timeline ? `Timeline: ${requestForm.timeline}` : '',
        requestForm.budget ? `Budget: ${requestForm.budget}` : ''
      ]
        .filter(Boolean)
        .join('\n\n');

      const data = await submitContactInquiry({
        intent: 'consulting',
        topic: '',
        customTopic: `Similar product request: ${product.title}`,
        name: requestForm.name,
        email: requestForm.email,
        organization: requestForm.organization,
        role: requestForm.role,
        subject: `Request a similar product to ${product.title}`,
        message: details
      });

      setRequestMessage(data.message || 'Request received. PlaneForge will respond by email.');
      setRequestForm({
        ...requestInitial(user),
        name: requestForm.name,
        email: requestForm.email,
        organization: requestForm.organization,
        role: requestForm.role
      });
    } catch (err) {
      setRequestError(err.message);
    } finally {
      setRequestBusy(false);
    }
  };

  return (
    <main>
      <section
        className="course-hero product-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(5, 24, 32, 0.92), rgba(5, 24, 32, 0.5)), url(${product.thumbnail || image})`
        }}
      >
        <div>
          <p className="eyebrow">{product.category}</p>
          <h1>{product.title}</h1>
          <p>{product.description}</p>
          <div className="hero-stats">
            <span>
              {product.productType === 'digital' ? <Box size={17} /> : <CircuitBoard size={17} />}
              {product.productType === 'digital' ? 'Digital product' : 'Physical product'}
            </span>
            <span>
              <PackageCheck size={17} />
              {stockLabel(product)}
            </span>
            {product.sku && <span>{product.sku}</span>}
          </div>
        </div>
        <aside className="enroll-panel product-buy-panel">
          <strong>{pricing.isFree ? 'Free' : money(pricing.finalPrice, product.currency)}</strong>
          {pricing.onSale && (
            <span className="price-strike">
              {money(pricing.originalPrice, product.currency)} / {pricing.percentageOff}% off
            </span>
          )}
          <p>{product.productType === 'digital' ? 'Download or digital delivery after payment.' : 'Hardware product order.'}</p>
          <label>
            Quantity
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              type="number"
              min="1"
              max={quantityLimit}
              disabled={unavailable}
            />
          </label>
          <button className="button primary full" type="button" onClick={buyProduct} disabled={unavailable}>
            <CreditCard size={18} />
            {unavailable ? 'Out of Stock' : 'Buy Now'}
          </button>
          <button className="button ghost full" type="button" onClick={addProductToCart} disabled={unavailable || cartBusy}>
            <ShoppingCart size={18} />
            {cartBusy ? 'Adding' : 'Add to Cart'}
          </button>
          <a className="button subtle full" href="#request-similar">
            <Hammer size={18} />
            Request Similar Build
          </a>
          {product.productType === 'digital' && (
            <button className="button ghost full" type="button" onClick={loadDigitalAccess} disabled={accessBusy === 'access'}>
              <Download size={18} />
              {accessBusy === 'access' ? 'Checking Access' : 'Access Purchased Files'}
            </button>
          )}
          {cartMessage && <p className="form-success">{cartMessage}</p>}
          {cartError && <p className="form-error">{cartError}</p>}
          {accessMessage && <p className="form-success">{accessMessage}</p>}
          {accessError && <p className="form-error">{accessError}</p>}
          <span>
            <ShieldCheck size={16} /> Secure checkout through Stripe.
          </span>
        </aside>
      </section>

      <section className="section detail-grid product-detail-grid">
        <article>
          <div className="product-gallery">
            <img src={image} alt={`${product.title} product preview`} loading="lazy" decoding="async" />
            {galleryImages.length > 1 && (
              <div>
                {galleryImages.map((item) => (
                  <button
                    className={item === image ? 'active' : ''}
                    type="button"
                    key={item}
                    onClick={() => setSelectedImage(item)}
                    aria-label={`View ${product.title} image`}
                  >
                    <img src={item} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <h2>Product Details</h2>
          <p>{product.shortDescription || product.description}</p>
          <p>{product.description}</p>

          <div className="check-grid product-check-grid">
            <span>
              <Tag size={17} />
              {product.brand || product.subcategory || product.category}
            </span>
            <span>
              <PackageCheck size={17} />
              {stockLabel(product)}
            </span>
            <span>
              <Truck size={17} />
              {product.productType === 'digital' ? 'Digital fulfillment' : 'Order fulfillment after payment'}
            </span>
            <span>
              <Hammer size={17} />
              Similar custom builds can be requested below
            </span>
          </div>
          {!!specs.length && (
            <>
              <h2>Specifications</h2>
              <div className="product-spec-grid">
                {specs.map((item) => (
                  <div key={`${item.label}-${item.value}`}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
          {product.productType === 'digital' && (
            <section className="dashboard-section digital-access-panel">
              <h2>
                <Download size={20} /> Digital delivery
              </h2>
              <p>{product.digitalDelivery?.instructions || 'Digital files unlock after verified payment.'}</p>
              {accessAssets.length ? (
                <div className="lesson-resource-grid">
                  {accessAssets.map((asset) => (
                    <button className="digital-asset-button" type="button" key={asset._id} onClick={() => downloadAsset(asset)} disabled={Boolean(accessBusy)}>
                      <Download size={17} />
                      <span>{asset.label}</span>
                      <small>{asset.fileName || asset.type || 'file'}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <button className="button ghost small" type="button" onClick={loadDigitalAccess} disabled={accessBusy === 'access'}>
                  <Download size={16} />
                  Verify Access
                </button>
              )}
            </section>
          )}
        </article>

        <aside className="contact-form product-request-form" id="request-similar">
          <div>
            <p className="eyebrow">Custom request</p>
            <h2>Request a similar product</h2>
            <p>
              Share the board, kit, tool, or workflow you want PlaneForge to make from this reference.
            </p>
          </div>
          <form onSubmit={submitRequest}>
            <label>
              Name
              <input value={requestForm.name} onChange={(event) => updateRequest('name', event.target.value)} required />
            </label>
            <label>
              Email
              <input
                value={requestForm.email}
                onChange={(event) => updateRequest('email', event.target.value)}
                type="email"
                required
              />
            </label>
            <label>
              Organization
              <input
                value={requestForm.organization}
                onChange={(event) => updateRequest('organization', event.target.value)}
                placeholder="Optional"
              />
            </label>
            <label>
              Role
              <input
                value={requestForm.role}
                onChange={(event) => updateRequest('role', event.target.value)}
                placeholder="Founder, engineer, buyer, manager"
              />
            </label>
            <label>
              Project use
              <input
                value={requestForm.projectUse}
                onChange={(event) => updateRequest('projectUse', event.target.value)}
                placeholder="Prototype, class kit, internal tool, product"
              />
            </label>
            <div className="contact-two-column">
              <label>
                Timeline
                <input
                  value={requestForm.timeline}
                  onChange={(event) => updateRequest('timeline', event.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label>
                Budget
                <input
                  value={requestForm.budget}
                  onChange={(event) => updateRequest('budget', event.target.value)}
                  placeholder="Optional"
                />
              </label>
            </div>
            <label>
              Build request
              <textarea
                value={requestForm.message}
                onChange={(event) => updateRequest('message', event.target.value)}
                placeholder="Describe what should be similar, what should change, quantities, constraints, and any files you already have."
                required
              />
            </label>
            {requestMessage && <p className="form-success">{requestMessage}</p>}
            {requestError && <p className="form-error">{requestError}</p>}
            <button className="button primary full" type="submit" disabled={requestBusy}>
              <Send size={18} />
              {requestBusy ? 'Sending Request' : 'Send Request'}
            </button>
          </form>
        </aside>
      </section>

    </main>
  );
};
