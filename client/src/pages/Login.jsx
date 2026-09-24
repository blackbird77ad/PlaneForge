import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, KeyRound, LogIn, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { PasswordField } from '../components/PasswordField.jsx';

const destinationFor = (from, role) => {
  if (typeof from === 'string') return from;
  if (from?.pathname) return `${from.pathname}${from.search || ''}`;
  const nextRole = ['student', 'learner', 'buyer'].includes(role) ? 'user' : role || 'user';
  return `/dashboard/${nextRole}`;
};

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyLogin, resendLoginCode } = useAuth();
  const [form, setForm] = useState({
    email: location.state?.email || '',
    password: ''
  });
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    try {
      if (!challenge) {
        const nextChallenge = await login(form);
        setChallenge(nextChallenge);
        setCode('');
        setNotice('Login code sent. Check your email to continue.');
      } else {
        const user = await verifyLogin({ challengeId: challenge.challengeId, code });
        navigate(destinationFor(location.state?.from, user.role), { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Unable to sign in right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    if (!challenge?.challengeId) return;

    setError('');
    setNotice('');
    setResendBusy(true);

    try {
      const nextChallenge = await resendLoginCode({ challengeId: challenge.challengeId });
      setChallenge(nextChallenge);
      setCode('');
      setNotice('A fresh login code was sent. Check your email again.');
    } catch (err) {
      setError(err.message || 'Unable to resend the login code right now.');
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Secure login</p>
        <h1>{challenge ? 'Enter your email code' : 'Sign in to PlaneForge'}</h1>
        <p>
          {challenge
            ? 'A short-lived code is required before this device can access purchased courses and products.'
            : 'Sign in as a PlaneForge user to buy products, enroll in courses, and manage purchases.'}
        </p>
        {notice && (
          <div className="auth-toast success" role="status">
            <CheckCircle size={18} />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="auth-toast error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
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
              <PasswordField
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                autoComplete="current-password"
              />
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
          {challenge?.expiresAt && (
            <p className="form-muted">Code expires {new Date(challenge.expiresAt).toLocaleTimeString()}.</p>
          )}
          <button className="button primary full" type="submit" disabled={busy}>
            {challenge ? <KeyRound size={18} /> : <LogIn size={18} />}
            {busy ? 'Please wait' : challenge ? 'Verify and Continue' : 'Send Login Code'}
          </button>
          {challenge && (
            <button
              className="button ghost full auth-secondary"
              type="button"
              onClick={resendCode}
              disabled={busy || resendBusy}
            >
              <RefreshCw size={18} />
              {resendBusy ? 'Sending again' : 'Send Code Again'}
            </button>
          )}
        </form>
        {challenge && (
          <button className="button ghost full auth-secondary" type="button" onClick={() => {
            setChallenge(null);
            setNotice('');
            setError('');
          }}>
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
