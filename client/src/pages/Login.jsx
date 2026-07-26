import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const destinationFor = (from, role) => {
  if (typeof from === 'string') return from;
  if (from?.pathname) return `${from.pathname}${from.search || ''}`;
  return `/dashboard/${role}`;
};

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemo } = useAuth();
  const [form, setForm] = useState({ email: 'student@planeforge.test', password: 'Password123!' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const user = await login(form);
      navigate(destinationFor(location.state?.from, user.role), { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const demo = (role) => {
    const user = loginAsDemo(role);
    navigate(`/dashboard/${user.role}`);
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Login</p>
        <h1>Welcome back to PlaneForge</h1>
        <form onSubmit={submit}>
          <label>
            Email
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" />
          </label>
          <label>
            Password
            <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button primary full" type="submit">
            <LogIn size={18} />
            Login
          </button>
        </form>
        <div className="demo-roles">
          {['student', 'consultant', 'partner', 'admin'].map((role) => (
            <button className="button ghost small" type="button" key={role} onClick={() => demo(role)}>
              {role}
            </button>
          ))}
        </div>
        <p>
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  );
};
