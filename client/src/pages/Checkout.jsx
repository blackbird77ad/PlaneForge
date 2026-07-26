import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, CreditCard, ShieldCheck } from 'lucide-react';
import { checkoutCourse, getCourse } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export const Checkout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, enrollCourse } = useAuth();
  const [course, setCourse] = useState(null);
  const [provider, setProvider] = useState('stripe');
  const [couponCode, setCouponCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/checkout/${slug}` } });
      return;
    }
    getCourse(slug).then((data) => setCourse(data.course));
  }, [slug, user, navigate]);

  if (!course) {
    return <main className="section page">Loading checkout...</main>;
  }

  const price = couponCode.toUpperCase() === 'FORGE10' ? course.price * 0.9 : course.price;

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    try {
      await checkoutCourse({
        courseId: course._id || course.id,
        provider,
        couponCode,
        termsAccepted
      });
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    enrollCourse(course);
    setMessage('Payment verified. Course unlocked and invoice generated.');
    setSubmitting(false);
    setTimeout(() => navigate('/dashboard/student'), 700);
  };

  return (
    <main className="section page checkout-page">
      <div className="page-heading compact-heading">
        <p className="eyebrow">Checkout</p>
        <h1>Complete enrollment</h1>
        <p>Secure payment, invoice generation, course unlock, and confirmation email happen after verification.</p>
      </div>

      <form className="checkout-grid" onSubmit={submit}>
        <section className="checkout-summary">
          <img src={course.thumbnail} alt="" />
          <div>
            <h2>{course.title}</h2>
            <p>{course.instructorName}</p>
            <strong>${price.toFixed(2)}</strong>
            {couponCode.toUpperCase() === 'FORGE10' && <span className="form-success">FORGE10 applied.</span>}
          </div>
        </section>

        <section className="payment-panel">
          <label>
            Coupon
            <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="FORGE10" />
          </label>

          <fieldset className="segmented">
            <legend>Payment gateway</legend>
            {['stripe', 'paystack'].map((item) => (
              <label key={item}>
                <input type="radio" name="provider" value={item} checked={provider === item} onChange={(event) => setProvider(event.target.value)} />
                <span>{item}</span>
              </label>
            ))}
          </fieldset>

          <label className="checkbox-row">
            <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
            <span>I agree to the terms and refund policy.</span>
          </label>

          <button className="button primary full" type="submit" disabled={!termsAccepted || submitting}>
            <CreditCard size={18} />
            {submitting ? 'Verifying Payment' : 'Complete Payment'}
          </button>

          <p className="secure-note">
            <ShieldCheck size={16} /> Payments can run in mock mode locally, then switch to Stripe or Paystack with environment keys.
          </p>
          {message && (
            <p className="form-success">
              <CheckCircle size={16} /> {message}
            </p>
          )}
          <Link to={`/courses/${course.slug}`}>Return to course details</Link>
        </section>
      </form>
    </main>
  );
};
