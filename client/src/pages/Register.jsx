import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, KeyRound, RefreshCw, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { PasswordField } from '../components/PasswordField.jsx';
import { PhoneNumberField } from '../components/PhoneNumberField.jsx';
import { getContactNumberError } from '../utils/contactNumber.js';

const today = new Date().toISOString().slice(0, 10);

export const Register = () => {
  const navigate = useNavigate();
  const { register, verifyLogin, resendLoginCode } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    contactNumber: '',
    dateOfBirth: '',
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

    if (!challenge && form.password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }

    if (!challenge) {
      const contactNumberError = getContactNumberError(form.contactNumber);
      if (contactNumberError) {
        setError(contactNumberError);
        return;
      }

      if (!form.dateOfBirth) {
        setError('Date of birth is required.');
        return;
      }
    }

    setBusy(true);
    try {
      if (!challenge) {
        const nextChallenge = await register({ ...form, role: 'user' });
        setChallenge(nextChallenge);
        setCode('');
        setNotice('Verification code sent. Check your email to finish creating the account.');
      } else {
        const user = await verifyLogin({ challengeId: challenge.challengeId, code });
        navigate('/dashboard/user');
      }
    } catch (err) {
      setError(err.message || 'Unable to create the account right now. Please try again.');
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
      setNotice('A fresh verification code was sent. Check your email again.');
    } catch (err) {
      setError(err.message || 'Unable to resend the verification code right now.');
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Sign up</p>
        <h1>{challenge ? 'Verify this device' : 'Create your PlaneForge account'}</h1>
        <p>
          {challenge
            ? 'Enter the code sent to your email to finish setup.'
            : 'Create one user account for course enrollment, product purchases, progress, and future product access.'}
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
                Full name
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </label>
              <label>
                Email
                <input
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  type="email"
                  required
                />
              </label>
              <PhoneNumberField
                value={form.contactNumber}
                onChange={(contactNumber) => setForm({ ...form, contactNumber })}
                required
              />
              <label>
                Date of birth
                <input
                  value={form.dateOfBirth}
                  onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
                  type="date"
                  max={today}
                  required
                />
              </label>
              <PasswordField
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                autoComplete="new-password"
              />
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
          <button className="button primary full" type="submit" disabled={busy}>
            {challenge ? <KeyRound size={18} /> : <UserPlus size={18} />}
            {busy ? 'Please wait' : challenge ? 'Verify Account' : 'Send Verification Code'}
          </button>
          {challenge?.expiresAt && (
            <p className="form-muted">Code expires {new Date(challenge.expiresAt).toLocaleTimeString()}.</p>
          )}
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
        <p>
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
};
