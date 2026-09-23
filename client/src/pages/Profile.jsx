import { useEffect, useState } from 'react';
import { Camera, LoaderCircle, Save, Trash2, UserRound } from 'lucide-react';
import { uploadImageAsset } from '../api/client.js';
import { DashboardShell } from '../components/DashboardShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = {
  name: '',
  contactNumber: '',
  dateOfBirth: '',
  title: '',
  avatar: '',
  organization: '',
  country: '',
  city: '',
  website: '',
  headline: '',
  experienceLevel: '',
  learningGoal: '',
  consultationFee: ''
};

const formFromUser = (user) => ({
  name: user?.name || '',
  contactNumber: user?.contactNumber || user?.profile?.phone || '',
  dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : '',
  title: user?.title || '',
  avatar: user?.avatar || '',
  organization: user?.profile?.organization || '',
  country: user?.profile?.country || '',
  city: user?.profile?.city || '',
  website: user?.profile?.website || '',
  headline: user?.profile?.headline || '',
  experienceLevel: user?.profile?.experienceLevel || '',
  learningGoal: user?.profile?.learningGoal || '',
  consultationFee: String(user?.requestedConsultationFee || user?.consultationFee || '')
});

const formatDateOfBirth = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium'
  }).format(date);
};

export const Profile = () => {
  const { user, updateUser, startProfileChange, finishProfileChange } = useAuth();
  const [form, setForm] = useState(() => (user ? formFromUser(user) : emptyForm));
  const [status, setStatus] = useState({ type: '', message: '' });
  const [securityChange, setSecurityChange] = useState(null);
  const [securityCode, setSecurityCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(user ? formFromUser(user) : emptyForm);
  }, [user]);

  const setField = (field) => (event) => {
    setStatus({ type: '', message: '' });
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const nextUser = await updateUser({
        name: form.name,
        title: form.title,
        avatar: form.avatar,
        profile: {
          organization: form.organization,
          country: form.country,
          city: form.city,
          website: form.website,
          headline: form.headline,
          experienceLevel: form.experienceLevel,
          learningGoal: form.learningGoal
        },
        ...(user?.role === 'consultant' || user?.role === 'admin'
          ? { consultationFee: Number(form.consultationFee || 0) }
          : {})
      });
      if (nextUser) setForm(formFromUser(nextUser));
      setStatus({ type: 'success', message: 'Profile updated.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Profile could not be updated.' });
    } finally {
      setSaving(false);
    }
  };

  const submitSecurityChange = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await startProfileChange({
        contactNumber: form.contactNumber,
        dateOfBirth: form.dateOfBirth
      });
      setSecurityChange(data);
      setSecurityCode('');
      setStatus({ type: 'success', message: data.message });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Verification code could not be sent.' });
    } finally {
      setSaving(false);
    }
  };

  const confirmSecurityChange = async (event) => {
    event?.preventDefault?.();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await finishProfileChange({
        challengeId: securityChange?.challengeId,
        code: securityCode
      });
      setSecurityChange(null);
      setSecurityCode('');
      if (data.user) setForm(formFromUser(data.user));
      setStatus({ type: 'success', message: data.message || 'Profile security details updated.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Verification failed.' });
    } finally {
      setSaving(false);
    }
  };

  const chooseAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', message: 'Choose an image file for your profile photo.' });
      return;
    }

    if (file.size > 900 * 1024) {
      setStatus({ type: 'error', message: 'Choose an image under 900 KB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const data = reader.result || '';
      setSaving(true);
      setStatus({ type: '', message: '' });

      try {
        const result = await uploadImageAsset({
          data,
          folder: 'planeforge/avatars',
          publicId: `${user?.id || user?._id || 'profile'}-avatar`
        });
        setForm((current) => ({ ...current, avatar: result.asset?.secureUrl || data }));
        setStatus({ type: 'success', message: 'Profile image uploaded.' });
      } catch (error) {
        setForm((current) => ({ ...current, avatar: data }));
        setStatus({
          type: 'error',
          message: error.message || 'Cloudinary upload failed. The local preview was kept.'
        });
      } finally {
        setSaving(false);
      }
    };
    reader.onerror = () => {
      setStatus({ type: 'error', message: 'That image could not be loaded.' });
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardShell title="Profile" subtitle="Manage the account details used across learning, purchases, and bookings.">
      <form className="profile-form" onSubmit={submit}>
        <div className="profile-avatar-row">
          <div className="profile-avatar">
            {form.avatar ? <img src={form.avatar} alt="" /> : <UserRound size={36} />}
          </div>
          <div className="profile-avatar-actions">
            <label>
              Profile image URL
              <input
                type="url"
                value={form.avatar.startsWith('data:') ? '' : form.avatar}
                onChange={setField('avatar')}
                placeholder="https://example.com/photo.jpg"
              />
            </label>
            <div className="profile-inline-actions">
              <label className="button secondary profile-upload">
                <Camera size={17} />
                Upload Image
                <input type="file" accept="image/*" onChange={chooseAvatar} />
              </label>
              {form.avatar && (
                <button
                  className="button danger"
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, avatar: '' }))}
                >
                  <Trash2 size={17} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="locked-account-grid">
          <label>
            Email
            <input value={user?.email || ''} readOnly disabled />
          </label>
          <span className="form-muted">Email cannot be changed from profile settings.</span>
        </div>

        <fieldset className="profile-secure-change">
          <legend>Verified account details</legend>
          <div className="profile-grid">
            <label>
              Contact number
              <input value={form.contactNumber} onChange={setField('contactNumber')} type="tel" />
            </label>
            <label>
              Date of birth
              <input value={form.dateOfBirth} onChange={setField('dateOfBirth')} type="date" />
            </label>
          </div>
          <span className="form-muted">
            Current date of birth: {formatDateOfBirth(user?.dateOfBirth)}. Changes are confirmed by an email code.
          </span>
          {securityChange ? (
            <div className="profile-code-row">
              <label>
                Verification code
                <input
                  value={securityCode}
                  onChange={(event) => setSecurityCode(event.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>
              <button className="button primary" type="button" onClick={confirmSecurityChange} disabled={saving}>
                {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
                Confirm Change
              </button>
            </div>
          ) : (
            <button className="button secondary" type="button" onClick={submitSecurityChange} disabled={saving}>
              Send Verification Code
            </button>
          )}
        </fieldset>

        <div className="profile-grid">
          <label>
            Full name
            <input value={form.name} onChange={setField('name')} required />
          </label>
          <label>
            Professional title
            <input value={form.title} onChange={setField('title')} placeholder="PCB design learner" />
          </label>
          <label>
            Organization
            <input value={form.organization} onChange={setField('organization')} />
          </label>
          <label>
            Country
            <input value={form.country} onChange={setField('country')} />
          </label>
          <label>
            City
            <input value={form.city} onChange={setField('city')} />
          </label>
          <label>
            Website
            <input type="url" value={form.website} onChange={setField('website')} placeholder="https://example.com" />
          </label>
          <label>
            Experience level
            <input value={form.experienceLevel} onChange={setField('experienceLevel')} placeholder="Beginner, intermediate, advanced" />
          </label>
        </div>

        <label>
          Headline
          <input value={form.headline} onChange={setField('headline')} placeholder="What you are building or learning now" />
        </label>

        <label>
          Learning goal
          <textarea
            value={form.learningGoal}
            onChange={setField('learningGoal')}
            placeholder="Add the courses, products, or hardware skills you want to focus on."
          />
        </label>

        {(user?.role === 'consultant' || user?.role === 'admin') && (
          <label>
            Consultation fee
            <input
              value={form.consultationFee}
              onChange={setField('consultationFee')}
              type="number"
              min="0"
              step="1"
              placeholder="250"
            />
            {user?.role === 'consultant' && (
              <span className="form-muted">
                Fee changes go live after admin approval. Current status: {user?.consultationFeeStatus || 'not requested'}.
              </span>
            )}
          </label>
        )}

        <div className="profile-actions">
          <button className="button primary" type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
            Save Profile
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setForm(user ? formFromUser(user) : emptyForm);
              setStatus({ type: '', message: '' });
            }}
            disabled={saving}
          >
            Reset Changes
          </button>
        </div>
        {status.type === 'success' && <p className="form-success">{status.message}</p>}
        {status.type === 'error' && <p className="form-error">{status.message}</p>}
      </form>
    </DashboardShell>
  );
};
