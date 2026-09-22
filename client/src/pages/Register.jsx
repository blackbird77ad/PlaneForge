import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const today = new Date().toISOString().slice(0, 10);

export const Register = () => {
  const navigate = useNavigate();
  const { register, verifyLogin } = useAuth();
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
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!challenge && form.password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }

    if (!challenge && (!form.contactNumber.trim() || !form.dateOfBirth)) {
      setError('Contact number and date of birth are required.');
      return;
    }

    setBusy(true);
    try {
      if (!challenge) {
        const nextChallenge = await register({ ...form, role: 'user' });
        setChallenge(nextChallenge);
        setCode('');
      } else {
        const user = await verifyLogin({ challengeId: challenge.challengeId, code });
        navigate('/dashboard/user');
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
        <p className="eyebrow">Sign up</p>
        <h1>{challenge ? 'Verify this device' : 'Create your PlaneForge account'}</h1>
        <p>
          {challenge
            ? 'Enter the code sent to your email to finish setup.'
            : 'Create one user account for course enrollment, product purchases, progress, and future product access.'}
        </p>
        <form onSubmit={submit}>
          {!challenge ? (
            <>
              <label>
                Name
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
              <label>
                Contact number
                <input
                  value={form.contactNumber}
                  onChange={(event) => setForm({ ...form, contactNumber: event.target.value })}
                  type="tel"
                  required
                />
              </label>
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
              <label>
                Password
                <input
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
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
                placeholder="6-digit code"
                required
              />
            </label>
          )}
          {challenge?.devCode && <p className="form-success">Development code: {challenge.devCode}</p>}
          {error && <p className="form-error">{error}</p>}
          <button className="button primary full" type="submit" disabled={busy}>
            {challenge ? <KeyRound size={18} /> : <UserPlus size={18} />}
            {busy ? 'Please wait' : challenge ? 'Verify Account' : 'Send Verification Code'}
          </button>
        </form>
        <p>
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
};
