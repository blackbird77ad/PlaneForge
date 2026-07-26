import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    title: user?.title || '',
    organization: user?.profile?.organization || '',
    country: user?.profile?.country || ''
  });
  const [saved, setSaved] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    updateUser({
      name: form.name,
      title: form.title,
      profile: {
        ...(user?.profile || {}),
        organization: form.organization,
        country: form.country
      }
    });
    setSaved(true);
  };

  return (
    <DashboardShell title="Profile" subtitle="Manage personal information used across learning, invoices, and bookings.">
      <form className="profile-form" onSubmit={submit}>
        <div className="profile-avatar">
          {user?.avatar ? <img src={user.avatar} alt="" /> : <UserRound size={36} />}
        </div>
        <label>
          Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label>
          Professional title
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label>
          Organization
          <input value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })} />
        </label>
        <label>
          Country
          <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
        </label>
        <button className="button primary" type="submit">
          Save Profile
        </button>
        {saved && <p className="form-success">Profile updated.</p>}
      </form>
    </DashboardShell>
  );
};
