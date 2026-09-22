import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, CreditCard, ExternalLink, PackageCheck, ShieldCheck } from 'lucide-react';
import { checkoutProduct, getProduct, verifyMockPayment } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { products as fallbackProducts } from '../data/catalog.js';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value || 0));

const findFallbackProduct = (slug) => fallbackProducts.find((item) => item.slug === slug);

const stockLimit = (product) => {
  if (product?.productType === 'digital') return 99;
  if (!product?.inventory?.track) return 99;
  return Math.max(1, Number(product.inventory.quantity || 1));
};

const isOutOfStock = (product) =>
  product?.productType !== 'digital' &&
  product?.inventory?.track &&
  Number(product.inventory.quantity || 0) <= 0;

export const ProductCheckout = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshMe } = useAuth();
  const initialProduct = findFallbackProduct(slug);
  const [product, setProduct] = useState(initialProduct || null);
  const [provider, setProvider] = useState('stripe');
  const [quantity, setQuantity] = useState(location.state?.quantity || 1);
  const [couponCode, setCouponCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/checkout/product/${slug}` } });
      return;
    }

    const localProduct = findFallbackProduct(slug);
    setProduct(localProduct || null);
    getProduct(slug).then((data) => setProduct(data.product || localProduct || null));
  }, [slug, user, navigate]);

  if (!product) {
    return <main className="section page">Loading checkout...</main>;
  }

  const limit = stockLimit(product);
  const safeQuantity = Math.min(Math.max(1, Number(quantity || 1)), limit);
  const basePrice = Number(product.price || 0) * safeQuantity;
  const price = couponCode.toUpperCase() === 'FORGE10' ? basePrice * 0.9 : basePrice;
  const unavailable = isOutOfStock(product);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    try {
      const data = await checkoutProduct({
        productId: product._id || product.id,
        provider,
        couponCode,
        termsAccepted,
        quantity: safeQuantity
      });

      if (data.payment?.checkoutUrl) {
        setMessage('Payment initialized. Opening the hosted payment page now.');
        window.location.assign(data.payment.checkoutUrl);
        return;
      }

      if (data.mockVerificationAvailable) {
        await verifyMockPayment(data.order._id);
        await refreshMe().catch(() => null);
        setMessage('Local payment verification completed. PlaneForge has recorded the product order.');
        return;
      }

      if (data.payment?.status === 'paid') {
        await refreshMe().catch(() => null);
        setMessage('Payment verified. PlaneForge has recorded the product order.');
        return;
      }

      setMessage(
        data.payment?.clientSecret
          ? 'Stripe payment is initialized. PlaneForge records the product order after Stripe confirms payment.'
          : 'Payment is initialized. PlaneForge records the product order after the provider verifies it.'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="section page checkout-page product-checkout-page">
      <div className="page-heading compact-heading">
        <p className="eyebrow">Product Checkout</p>
        <h1>Complete product purchase</h1>
        <p>PlaneForge records and fulfills product orders after payment verification.</p>
      </div>

      <form className="checkout-grid" onSubmit={submit}>
        <section className="checkout-summary">
          <img src={product.thumbnail || product.images?.[0]} alt="" loading="lazy" decoding="async" />
          <div>
            <h2>{product.title}</h2>
            <p>{product.category}</p>
            <strong>{money(price, product.currency)}</strong>
            <span>
              {safeQuantity} x {product.productType === 'digital' ? 'digital product' : 'hardware product'}
            </span>
            {product.sku && <span>{product.sku}</span>}
            {couponCode.toUpperCase() === 'FORGE10' && <span className="form-success">FORGE10 applied.</span>}
          </div>
        </section>

        <section className="payment-panel">
          <label>
            Quantity
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              type="number"
              min="1"
              max={limit}
              disabled={unavailable}
            />
          </label>

          <label>
            Coupon
            <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="FORGE10" />
          </label>

          <fieldset className="segmented">
            <legend>Payment gateway</legend>
            <label>
              <input
                type="radio"
                name="provider"
                value="stripe"
                checked={provider === 'stripe'}
                onChange={(event) => setProvider(event.target.value)}
              />
              <span>Stripe</span>
            </label>
            <label>
              <input
                type="radio"
                name="provider"
                value="paystack"
                checked={provider === 'paystack'}
                onChange={(event) => setProvider(event.target.value)}
              />
              <span>Paystack</span>
            </label>
          </fieldset>

          <p className="form-muted">
            Stripe handles global card payments. Paystack supports African payment flows, including mobile money where available.
          </p>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
            />
            <span>I agree to the terms and refund policy.</span>
          </label>

          <button className="button primary full" type="submit" disabled={!termsAccepted || submitting || unavailable}>
            <CreditCard size={18} />
            {unavailable ? 'Out of Stock' : submitting ? 'Initializing Payment' : 'Continue to Payment'}
          </button>

          <p className="secure-note">
            <ShieldCheck size={16} /> Product orders are tied to your verified PlaneForge account.
          </p>
          {message && (
            <p className="form-success">
              <CheckCircle size={16} /> {message}
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
          {message.includes('hosted payment') && (
            <a className="button ghost small" href={product.slug ? `/products/${product.slug}` : '/products'}>
              <ExternalLink size={16} />
              Return if the payment page did not open
            </a>
          )}
          {message.includes('recorded') && (
            <Link className="button ghost small" to="/profile">
              <PackageCheck size={16} />
              View Account
            </Link>
          )}
          <Link to={`/products/${product.slug}`}>Return to product details</Link>
        </section>
      </form>
    </main>
  );
};
