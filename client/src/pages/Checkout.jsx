import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, CreditCard, ExternalLink, ShieldCheck } from 'lucide-react';
import { checkoutCourse, getCourse, verifyMockPayment } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { courses as fallbackCourses } from '../data/catalog.js';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

export const Checkout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, enrollCourse, refreshMe } = useAuth();
  const initialCourse = fallbackCourses.find((item) => item.slug === slug);
  const [course, setCourse] = useState(initialCourse || null);
  const [provider, setProvider] = useState('stripe');
  const [country, setCountry] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/checkout/${slug}` } });
      return;
    }
    const localCourse = fallbackCourses.find((item) => item.slug === slug);
    setCourse(localCourse || null);
    getCourse(slug).then((data) => setCourse(data.course || localCourse || null));
  }, [slug, user, navigate]);

  if (!course) {
    return <main className="section page">Loading checkout...</main>;
  }

  const price = couponCode.toUpperCase() === 'FORGE10' ? course.price * 0.9 : course.price;

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    try {
      const data = await checkoutCourse({
        courseId: course._id || course.id,
        provider,
        country,
        couponCode,
        termsAccepted
      });

      if (data.payment?.checkoutUrl) {
        setMessage('Payment initialized. Opening the hosted payment page now.');
        window.location.assign(data.payment.checkoutUrl);
        return;
      }

      if (data.mockVerificationAvailable) {
        await verifyMockPayment(data.order._id);
        enrollCourse(course);
        await refreshMe().catch(() => null);
        setMessage('Local payment verification completed. Course streaming is unlocked.');
        setTimeout(() => navigate(`/learn/${course.slug}`), 700);
        return;
      }

      if (data.payment?.status === 'paid') {
        enrollCourse(course);
        await refreshMe().catch(() => null);
        setMessage('Payment verified. Course streaming is unlocked.');
        setTimeout(() => navigate(`/learn/${course.slug}`), 700);
        return;
      }

      setMessage(
        data.payment?.clientSecret
          ? 'Stripe payment is initialized. Access unlocks after Stripe confirms payment and the webhook verifies it.'
          : 'Payment is initialized. Course access unlocks after the payment provider verifies it.'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="section page checkout-page">
      <div className="page-heading compact-heading">
        <p className="eyebrow">Checkout</p>
        <h1>Complete enrollment</h1>
        <p>Course streaming unlocks only after payment verification.</p>
      </div>

      <form className="checkout-grid" onSubmit={submit}>
        <section className="checkout-summary">
          <img src={course.thumbnail} alt="" loading="lazy" decoding="async" />
          <div>
            <h2>{course.title}</h2>
            <p>{course.instructorName}</p>
            <strong>{money(price, course.currency)}</strong>
            <span>{course.purchaseType === 'subscription' ? 'Course subscription' : 'One-time course access'}</span>
            {couponCode.toUpperCase() === 'FORGE10' && <span className="form-success">FORGE10 applied.</span>}
          </div>
        </section>

        <section className="payment-panel">
          <label>
            Country
            <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Optional" />
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

          <button className="button primary full" type="submit" disabled={!termsAccepted || submitting}>
            <CreditCard size={18} />
            {submitting ? 'Initializing Payment' : 'Continue to Payment'}
          </button>

          <p className="secure-note">
            <ShieldCheck size={16} /> One verified account session can stream on one active device at a time.
          </p>
          {message && (
            <p className="form-success">
              <CheckCircle size={16} /> {message}
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
          {message.includes('hosted payment') && (
            <a className="button ghost small" href={course.slug ? `/courses/${course.slug}` : '/courses'}>
              <ExternalLink size={16} />
              Return if the payment page did not open
            </a>
          )}
          <Link to={`/courses/${course.slug}`}>Return to course details</Link>
        </section>
      </form>
    </main>
  );
};
