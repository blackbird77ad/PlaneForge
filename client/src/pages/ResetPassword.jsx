import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startPasswordReset, finishPasswordReset } = useAuth();
  const [step, setStep] = useState('request');
  const [form, setForm] = useState({
    email: location.state?.email || '',
    code: '',
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
        const data = await startPasswordReset({ email: form.email, role: 'learner' });
        setMessage(data.devCode ? `${data.message} Development code: ${data.devCode}` : data.message);
        setStep('reset');
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
        role: 'learner',
        code: form.code,
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
        <h1>{step === 'request' ? 'Request a reset code' : 'Create a new password'}</h1>
        <p>
          {step === 'request'
            ? 'Enter the email address for your learner account, then PlaneForge will send a one-time reset code.'
            : 'Enter the reset code from your email and set a new password.'}
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              type="email"
              required
              disabled={step === 'reset'}
            />
          </label>

          {step === 'reset' && (
            <>
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
              <label>
                New password
                <input
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  type="password"
                  required
                />
              </label>
              <label>
                Confirm password
                <input
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  type="password"
                  required
                />
              </label>
            </>
          )}

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button className="button primary full" type="submit" disabled={busy}>
            {step === 'request' ? <RotateCcw size={18} /> : <KeyRound size={18} />}
            {busy ? 'Please wait' : step === 'request' ? 'Send Reset Code' : 'Reset Password'}
          </button>
        </form>
        {step === 'reset' && (
          <button className="button ghost full auth-secondary" type="button" onClick={() => setStep('request')}>
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
