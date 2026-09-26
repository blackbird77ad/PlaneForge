import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, LogIn, RotateCcw, UserPlus } from 'lucide-react';
import { ConsultantDashboard } from './ConsultantDashboard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PasswordField } from '../components/PasswordField.jsx';
import { PhoneNumberField } from '../components/PhoneNumberField.jsx';
import { getContactNumberError } from '../utils/contactNumber.js';

const today = new Date().toISOString().slice(0, 10);

const initialForms = {
  login: { email: '', password: '' },
  signup: { name: '', email: '', contactNumber: '', dateOfBirth: '', password: '' },
  reset: { email: '', code: '', resetToken: '', password: '', confirmPassword: '' }
};

const dashboardPath = (role) =>
  `/dashboard/${['student', 'learner', 'buyer'].includes(role) ? 'user' : role || 'user'}`;

export const ConsultantAccess = () => {
  const navigate = useNavigate();
  const {
    finishPasswordReset,
    login,
    logout,
    register,
    startPasswordReset,
    user,
    verifyPasswordResetCode,
    verifyLogin
  } = useAuth();
  const [mode, setMode] = useState('login');
  const [forms, setForms] = useState(initialForms);
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [resetStep, setResetStep] = useState('request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user?.role === 'consultant' || user?.role === 'admin') {
    return <ConsultantDashboard />;
  }

  const update = (formName, key, value) =>
    setForms((current) => ({
      ...current,
      [formName]: {
        ...current[formName],
        [key]: value
      }
    }));

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setChallenge(null);
    setCode('');
    setResetStep('request');
    setMessage('');
    setError('');
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    try {
      if (!challenge) {
        const nextChallenge = await login({ ...forms.login, role: 'consultant' });
        setChallenge(nextChallenge);
        setCode('');
      } else {
        await verifyLogin({ challengeId: challenge.challengeId, code });
        navigate('/dashboard/consultant', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!challenge && forms.signup.password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }

    if (!challenge) {
      const contactNumberError = getContactNumberError(forms.signup.contactNumber);
      if (contactNumberError) {
        setError(contactNumberError);
        return;
      }

      if (!forms.signup.dateOfBirth) {
        setError('Date of birth is required.');
        return;
      }
    }

    setBusy(true);
    try {
      if (!challenge) {
        const nextChallenge = await register({
          ...forms.signup,
          role: 'consultant'
        });
        if (nextChallenge.requiresApproval) {
          setMessage(nextChallenge.message);
          setForms((current) => ({
            ...current,
            signup: initialForms.signup
          }));
          setMode('login');
          return;
        }
        setChallenge(nextChallenge);
        setCode('');
      } else {
        await verifyLogin({ challengeId: challenge.challengeId, code });
        navigate('/dashboard/consultant', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    try {
      if (resetStep === 'request') {
        const data = await startPasswordReset({ email: forms.reset.email, role: 'consultant' });
        setMessage(data.message);
        setResetStep('verify');
        return;
      }

      if (resetStep === 'verify') {
        const data = await verifyPasswordResetCode({
          email: forms.reset.email,
          role: 'consultant',
          code: forms.reset.code
        });
        update('reset', 'resetToken', data.resetToken || '');
        setMessage(data.message || 'Reset code verified. Set a new password now.');
        setResetStep('password');
        return;
      }

      if (forms.reset.password.length < 8) {
        setError('Use at least 8 characters.');
        return;
      }

      if (forms.reset.password !== forms.reset.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const data = await finishPasswordReset({
        email: forms.reset.email,
        role: 'consultant',
        resetToken: forms.reset.resetToken,
        password: forms.reset.password
      });
      setMessage(data.message);
      setTimeout(() => switchMode('login'), 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (user && user.role !== 'consultant') {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <p className="eyebrow">Consultant</p>
          <h1>Consultant access is separate</h1>
          <p>You are signed in with another PlaneForge account. Sign out first to use consultant access.</p>
          <button className="button primary full" type="button" onClick={logout}>
            Sign Out
          </button>
          <Link className="button ghost full auth-secondary" to={dashboardPath(user.role)}>
            Return to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-panel admin-auth-panel">
        <p className="eyebrow">Consultant Access</p>
        <h1>{challenge ? 'Verify consultant email code' : 'PlaneForge consultant'}</h1>
        <p>
          {challenge
            ? 'Enter the one-time code sent to your consultant email address.'
            : 'Consultants can sign in, request an account, or reset access from this private URL. New consultant accounts require admin approval.'}
        </p>

        {!challenge && (
          <div className="admin-auth-tabs" role="tablist" aria-label="Consultant auth mode">
            <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => switchMode('login')}>
              Sign In
            </button>
            <button className={mode === 'signup' ? 'active' : ''} type="button" onClick={() => switchMode('signup')}>
              Sign Up
            </button>
            <button className={mode === 'reset' ? 'active' : ''} type="button" onClick={() => switchMode('reset')}>
              Reset
            </button>
          </div>
        )}

        {message && mode !== 'reset' && <p className="form-success">{message}</p>}

        {mode === 'login' && (
          <form onSubmit={submitLogin}>
            {!challenge ? (
              <>
                <label>
                  Consultant email
                  <input
                    value={forms.login.email}
                    onChange={(event) => update('login', 'email', event.target.value)}
                    type="email"
                    required
                  />
                </label>
                <PasswordField
                  value={forms.login.password}
                  onChange={(event) => update('login', 'password', event.target.value)}
                  autoComplete="current-password"
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
                  required
                />
              </label>
            )}
            {error && <p className="form-error">{error}</p>}
            <button className="button primary full" type="submit" disabled={busy}>
              {challenge ? <KeyRound size={18} /> : <LogIn size={18} />}
              {busy ? 'Please wait' : challenge ? 'Verify Consultant' : 'Send Consultant Code'}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={submitSignup}>
            {!challenge ? (
              <>
                <label>
                  Full name
                  <input
                    value={forms.signup.name}
                    onChange={(event) => update('signup', 'name', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Consultant email
                  <input
                    value={forms.signup.email}
                    onChange={(event) => update('signup', 'email', event.target.value)}
                    type="email"
                    required
                  />
                </label>
                <PasswordField
                  value={forms.signup.password}
                  onChange={(event) => update('signup', 'password', event.target.value)}
                  autoComplete="new-password"
                />
                <PhoneNumberField
                  value={forms.signup.contactNumber}
                  onChange={(contactNumber) => update('signup', 'contactNumber', contactNumber)}
                  required
                />
                <label>
                  Date of birth
                  <input
                    value={forms.signup.dateOfBirth}
                    onChange={(event) => update('signup', 'dateOfBirth', event.target.value)}
                    type="date"
                    max={today}
                    required
                  />
                </label>
              </>
            ) : (
              <label>
                Verification code
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>
            )}
            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}
            <button className="button primary full" type="submit" disabled={busy}>
              {challenge ? <KeyRound size={18} /> : <UserPlus size={18} />}
              {busy ? 'Please wait' : challenge ? 'Verify Consultant' : 'Create Consultant Account'}
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={submitReset}>
            <label>
              Consultant email
              <input
                value={forms.reset.email}
                onChange={(event) => update('reset', 'email', event.target.value)}
                type="email"
                required
                disabled={resetStep !== 'request'}
              />
            </label>
            {resetStep === 'verify' && (
              <label>
                Reset code
                <input
                  value={forms.reset.code}
                  onChange={(event) => update('reset', 'code', event.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>
            )}
            {resetStep === 'password' && (
              <>
                <label>
                  Verified reset code
                  <input value={forms.reset.code} readOnly disabled />
                </label>
                <PasswordField
                  label="New password"
                  value={forms.reset.password}
                  onChange={(event) => update('reset', 'password', event.target.value)}
                  autoComplete="new-password"
                />
                <PasswordField
                  label="Confirm password"
                  value={forms.reset.confirmPassword}
                  onChange={(event) => update('reset', 'confirmPassword', event.target.value)}
                  autoComplete="new-password"
                />
              </>
            )}
            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}
            <button className="button primary full" type="submit" disabled={busy}>
              {resetStep === 'request' ? <RotateCcw size={18} /> : <KeyRound size={18} />}
              {busy
                ? 'Please wait'
                : resetStep === 'request'
                  ? 'Send Reset Code'
                  : resetStep === 'verify'
                    ? 'Verify Code'
                    : 'Reset Consultant Password'}
            </button>
          </form>
        )}

        {challenge && (
          <button className="button ghost full auth-secondary" type="button" onClick={() => setChallenge(null)}>
            Use a different consultant email
          </button>
        )}
      </section>
    </main>
  );
};
