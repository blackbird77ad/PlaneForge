import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { subscribeNewsletter } from '../api/client.js';

export const NewsletterForm = ({ compact = false }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setStatus('');
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    await subscribeNewsletter(email);
    setStatus('Subscription confirmed.');
    setEmail('');
  };

  return (
    <form className={compact ? 'newsletter compact' : 'newsletter'} onSubmit={submit}>
      <label htmlFor={compact ? 'footer-email' : 'newsletter-email'}>Newsletter</label>
      <div className="input-action">
        <span aria-hidden="true">
          <Mail size={18} />
        </span>
        <input
          id={compact ? 'footer-email' : 'newsletter-email'}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="you@example.com"
        />
        <button type="submit">
          {compact ? <Send size={17} /> : 'Subscribe'}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {status && <p className="form-success">{status}</p>}
    </form>
  );
};
