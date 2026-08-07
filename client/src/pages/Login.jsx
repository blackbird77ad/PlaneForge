import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const destinationFor = (from, role) => {
  if (typeof from === 'string') return from;
  if (from?.pathname) return `${from.pathname}${from.search || ''}`;
  return `/dashboard/${role || 'student'}`;
};

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyLogin } = useAuth();
  const [form, setForm] = useState({
    email: location.state?.email || '',
    password: ''
  });
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (!challenge) {
        const nextChallenge = await login({ ...form, role: 'learner' });
        setChallenge(nextChallenge);
        setCode('');
      } else {
        const user = await verifyLogin({ challengeId: challenge.challengeId, code });
        navigate(destinationFor(location.state?.from, user.role), { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Secure login</p>
        <h1>{challenge ? 'Enter your email code' : 'Sign in to PlaneForge'}</h1>
        <p>
          {challenge
            ? 'A short-lived code is required before this device can stream purchased lessons.'
            : 'Sign in with your email and password, then verify the one-time code sent to you.'}
        </p>
        <form onSubmit={submit}>
          {!challenge ? (
            <>
              <label>
                Email
                <input
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  type="email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  type="password"
                  required
                />
              </label>
              <Link className="auth-inline-link" to="/reset-password" state={{ email: form.email }}>
                Reset password
              </Link>
            </>
          ) : (
            <label>
              Verification code
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                required
              />
            </label>
          )}
          {challenge?.devCode && <p className="form-success">Development code: {challenge.devCode}</p>}
          {challenge?.expiresAt && (
            <p className="form-muted">Code expires {new Date(challenge.expiresAt).toLocaleTimeString()}.</p>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="button primary full" type="submit" disabled={busy}>
            {challenge ? <KeyRound size={18} /> : <LogIn size={18} />}
            {busy ? 'Please wait' : challenge ? 'Verify and Continue' : 'Send Login Code'}
          </button>
        </form>
        {challenge && (
          <button className="button ghost full auth-secondary" type="button" onClick={() => setChallenge(null)}>
            Use a different email
          </button>
        )}
        <p>
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  );
};
