import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }

    const user = await register(form);
    navigate(`/dashboard/${user.role}`);
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Register</p>
        <h1>Create your PlaneForge account</h1>
        <form onSubmit={submit}>
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Email
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required />
          </label>
          <label>
            Password
            <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required />
          </label>
          <label>
            Account type
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="student">Student</option>
              <option value="consultant">Engineering Consultant</option>
              <option value="partner">Business Partner</option>
            </select>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button primary full" type="submit">
            <UserPlus size={18} />
            Register
          </button>
        </form>
        <p>
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
};
