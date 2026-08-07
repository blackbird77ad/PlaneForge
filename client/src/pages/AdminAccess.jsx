import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, LogIn, RotateCcw, ShieldCheck, UserPlus } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const initialForms = {
  login: { email: '', password: '' },
  signup: { name: '', email: '', password: '', adminSetupCode: '' },
  reset: { email: '', code: '', password: '', confirmPassword: '' }
};

export const AdminAccess = () => {
  const navigate = useNavigate();
  const {
    finishPasswordReset,
    login,
    logout,
    register,
    startPasswordReset,
    user,
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

  if (user?.role === 'admin') {
    return <AdminDashboard />;
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
        const nextChallenge = await login({ ...forms.login, role: 'admin' });
        setChallenge(nextChallenge);
        setCode('');
      } else {
        const verifiedUser = await verifyLogin({ challengeId: challenge.challengeId, code });
        navigate('/dashboard/admin', { replace: true });
        return verifiedUser;
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

    setBusy(true);
    try {
      if (!challenge) {
        const nextChallenge = await register({
          ...forms.signup,
          role: 'admin'
        });
        setChallenge(nextChallenge);
        setCode('');
      } else {
        await verifyLogin({ challengeId: challenge.challengeId, code });
        navigate('/dashboard/admin', { replace: true });
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
        const data = await startPasswordReset({ email: forms.reset.email, role: 'admin' });
        setMessage(data.devCode ? `${data.message} Development code: ${data.devCode}` : data.message);
        setResetStep('complete');
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
        role: 'admin',
        code: forms.reset.code,
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

  if (user && user.role !== 'admin') {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <p className="eyebrow">Admin</p>
          <h1>Admin access is separate</h1>
          <p>You are signed in as a learner. Sign out first to use the private admin access page.</p>
          <button className="button primary full" type="button" onClick={logout}>
            Sign Out
          </button>
          <Link className="button ghost full auth-secondary" to="/dashboard/student">
            Return to learner dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-panel admin-auth-panel">
        <p className="eyebrow">Private Admin Access</p>
        <h1>{challenge ? 'Verify admin email code' : 'PlaneForge admin'}</h1>
        <p>
          {challenge
            ? 'Enter the one-time code sent to the admin email address.'
            : 'Admin sign in, setup, and password reset live only on this private URL.'}
        </p>

        {!challenge && (
          <div className="admin-auth-tabs" role="tablist" aria-label="Admin auth mode">
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

        {mode === 'login' && (
          <form onSubmit={submitLogin}>
            {!challenge ? (
              <>
                <label>
                  Admin email
                  <input
                    value={forms.login.email}
                    onChange={(event) => update('login', 'email', event.target.value)}
                    type="email"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    value={forms.login.password}
                    onChange={(event) => update('login', 'password', event.target.value)}
                    type="password"
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
            {challenge?.devCode && <p className="form-success">Development code: {challenge.devCode}</p>}
            {error && <p className="form-error">{error}</p>}
            <button className="button primary full" type="submit" disabled={busy}>
              {challenge ? <KeyRound size={18} /> : <LogIn size={18} />}
              {busy ? 'Please wait' : challenge ? 'Verify Admin' : 'Send Admin Code'}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={submitSignup}>
            {!challenge ? (
              <>
                <label>
                  Name
                  <input
                    value={forms.signup.name}
                    onChange={(event) => update('signup', 'name', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Admin email
                  <input
                    value={forms.signup.email}
                    onChange={(event) => update('signup', 'email', event.target.value)}
                    type="email"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    value={forms.signup.password}
                    onChange={(event) => update('signup', 'password', event.target.value)}
                    type="password"
                    required
                  />
                </label>
                <label>
                  Admin setup code
                  <input
                    value={forms.signup.adminSetupCode}
                    onChange={(event) => update('signup', 'adminSetupCode', event.target.value)}
                    type="password"
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
            {challenge?.devCode && <p className="form-success">Development code: {challenge.devCode}</p>}
            {error && <p className="form-error">{error}</p>}
            <button className="button primary full" type="submit" disabled={busy}>
              {challenge ? <KeyRound size={18} /> : <UserPlus size={18} />}
              {busy ? 'Please wait' : challenge ? 'Verify Admin' : 'Create Admin'}
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={submitReset}>
            <label>
              Admin email
              <input
                value={forms.reset.email}
                onChange={(event) => update('reset', 'email', event.target.value)}
                type="email"
                required
                disabled={resetStep === 'complete'}
              />
            </label>
            {resetStep === 'complete' && (
              <>
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
                <label>
                  New password
                  <input
                    value={forms.reset.password}
                    onChange={(event) => update('reset', 'password', event.target.value)}
                    type="password"
                    required
                  />
                </label>
                <label>
                  Confirm password
                  <input
                    value={forms.reset.confirmPassword}
                    onChange={(event) => update('reset', 'confirmPassword', event.target.value)}
                    type="password"
                    required
                  />
                </label>
              </>
            )}
            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}
            <button className="button primary full" type="submit" disabled={busy}>
              {resetStep === 'request' ? <RotateCcw size={18} /> : <ShieldCheck size={18} />}
              {busy ? 'Please wait' : resetStep === 'request' ? 'Send Reset Code' : 'Reset Admin Password'}
            </button>
          </form>
        )}

        {challenge && (
          <button className="button ghost full auth-secondary" type="button" onClick={() => setChallenge(null)}>
            Use a different admin email
          </button>
        )}
      </section>
    </main>
  );
};
