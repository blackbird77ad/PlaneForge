import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { PasswordField } from '../components/PasswordField.jsx';

export const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startPasswordReset, verifyPasswordResetCode, finishPasswordReset } = useAuth();
  const query = new URLSearchParams(location.search);
  const initialCode = query.get('code') || '';
  const initialEmail = location.state?.email || query.get('email') || '';
  const [step, setStep] = useState(initialCode ? 'verify' : 'request');
  const [form, setForm] = useState({
    email: initialEmail,
    code: initialCode,
    resetToken: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setBusy(true);

    try {
      if (step === 'request') {
        const data = await startPasswordReset({ email: form.email });
        setMessage(data.message);
        setStep('verify');
        return;
      }

      if (step === 'verify') {
        const data = await verifyPasswordResetCode({
          email: form.email,
          code: form.code
        });
        setForm((current) => ({ ...current, resetToken: data.resetToken || '' }));
        setMessage(data.message || 'Reset code verified. Set a new password now.');
        setStep('password');
        return;
      }

      if (form.password.length < 8) {
        setError('Use at least 8 characters.');
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const data = await finishPasswordReset({
        email: form.email,
        resetToken: form.resetToken,
        password: form.password
      });
      setMessage(data.message);
      setTimeout(() => navigate('/login', { state: { email: form.email } }), 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Reset password</p>
        <h1>
          {step === 'request'
            ? 'Request a reset code'
            : step === 'verify'
              ? 'Enter your reset code'
              : 'Create a new password'}
        </h1>
        <p>
          {step === 'request'
            ? 'Enter the email address for your PlaneForge account, then PlaneForge will send a one-time reset code.'
            : step === 'verify'
              ? 'Enter the one-time code from your email. The code can only be used once.'
              : 'Set a new password for this account.'}
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              type="email"
              required
              disabled={step !== 'request'}
            />
          </label>

          {step === 'verify' && (
            <label>
              Reset code
              <input
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
                inputMode="numeric"
                maxLength={6}
                required
              />
            </label>
          )}

          {step === 'password' && (
            <>
              <label>
                Verified reset code
                <input
                  value={form.code}
                  readOnly
                  disabled
                />
              </label>
              <PasswordField
                label="New password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                autoComplete="new-password"
              />
              <PasswordField
                label="Confirm password"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                autoComplete="new-password"
              />
            </>
          )}

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button className="button primary full" type="submit" disabled={busy}>
            {step === 'request' ? <RotateCcw size={18} /> : <KeyRound size={18} />}
            {busy
              ? 'Please wait'
              : step === 'request'
                ? 'Send Reset Code'
                : step === 'verify'
                  ? 'Verify Code'
                  : 'Reset Password'}
          </button>
        </form>
        {step !== 'request' && (
          <button
            className="button ghost full auth-secondary"
            type="button"
            onClick={() => {
              setStep('request');
              setForm((current) => ({ ...current, code: '', resetToken: '', password: '', confirmPassword: '' }));
              setMessage('');
              setError('');
            }}
          >
            Request a new code
          </button>
        )}
        <p>
          Remembered it? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
};
