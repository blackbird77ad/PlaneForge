import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BriefcaseBusiness, CalendarDays, CheckCircle2, LoaderCircle, MapPin, Send, UploadCloud } from 'lucide-react';
import { getCareer, getCareers, submitCareerApplication } from '../api/client.js';

const statusLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => (value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Open');

const fileToDocument = (file, key = 'resume') =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        key,
        label: key === 'resume' ? 'Resume' : 'Portfolio',
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        data: reader.result
      });
    reader.onerror = () => reject(new Error('File could not be read'));
    reader.readAsDataURL(file);
  });

const PositionCard = ({ position }) => (
  <article className="career-card">
    <div>
      <span className="admin-pill">{statusLabel(position.department || position.employmentType)}</span>
      <h2>{position.title}</h2>
      <p>{position.shortDescription}</p>
    </div>
    <div className="career-meta">
      <span><BriefcaseBusiness size={16} /> {statusLabel(position.employmentType)}</span>
      <span><MapPin size={16} /> {[position.location, position.country].filter(Boolean).join(', ') || statusLabel(position.workArrangement)}</span>
      <span><CalendarDays size={16} /> {formatDate(position.applicationDeadline)}</span>
    </div>
    <Link className="button secondary small" to={`/careers/${position.slug}`}>
      View Position
    </Link>
  </article>
);

export const Careers = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCareers()
      .then((data) => setPositions(data.positions || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="section-page careers-page">
      <section className="page-heading">
        <p className="eyebrow">Careers</p>
        <h1>Build practical electronics education with PlaneForge.</h1>
        <p>Open roles across course production, hardware education, operations, support, and growth.</p>
      </section>

      {loading && <p className="state-message"><LoaderCircle className="spin" size={18} /> Loading open roles...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && positions.length === 0 && (
        <section className="dashboard-section empty-careers">
          <h2>No Current Openings</h2>
          <p>There are no published roles right now. Check back for PlaneForge course, product, and operations openings.</p>
          <Link className="button primary" to="/contact">Contact PlaneForge</Link>
        </section>
      )}

      <section className="career-grid">
        {positions.map((position) => (
          <PositionCard position={position} key={position._id || position.slug} />
        ))}
      </section>
    </main>
  );
};

export const CareerDetails = () => {
  const { slug } = useParams();
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    currentPosition: '',
    yearsOfExperience: '',
    linkedin: '',
    portfolio: '',
    coverNote: ''
  });
  const [files, setFiles] = useState({});

  useEffect(() => {
    getCareer(slug)
      .then((data) => setPosition(data.position))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const customFields = useMemo(() => position?.applicationFields || [], [position]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const documents = [];
      for (const [key, file] of Object.entries(files)) {
        if (!file) continue;
        if (file.size > 5 * 1024 * 1024) throw new Error('Uploaded documents must be 5 MB or smaller.');
        documents.push(await fileToDocument(file, key));
      }
      await submitCareerApplication(slug, {
        applicant: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          city: form.city
        },
        professional: {
          currentPosition: form.currentPosition,
          yearsOfExperience: form.yearsOfExperience,
          linkedin: form.linkedin,
          portfolio: form.portfolio
        },
        answers: [
          { key: 'coverNote', label: 'Cover note', value: form.coverNote },
          ...customFields.map((field) => ({ key: field.key, label: field.label, value: form[field.key] || '' }))
        ],
        documents
      });
      setNotice('Application submitted successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="section-page"><p className="state-message"><LoaderCircle className="spin" size={18} /> Loading position...</p></main>;
  if (error && !position) return <main className="section-page"><p className="form-error">{error}</p></main>;

  return (
    <main className="section-page career-detail-page">
      <section className="page-heading compact-heading">
        <p className="eyebrow">{position.hiringCompany || 'PlaneForge'} Careers</p>
        <h1>{position.title}</h1>
        <p>{position.shortDescription}</p>
      </section>

      <section className="career-detail-layout">
        <article className="dashboard-section career-body">
          <div className="career-meta">
            <span><BriefcaseBusiness size={16} /> {statusLabel(position.employmentType)}</span>
            <span><MapPin size={16} /> {[position.location, position.country].filter(Boolean).join(', ') || statusLabel(position.workArrangement)}</span>
            <span><CalendarDays size={16} /> Apply by {formatDate(position.applicationDeadline)}</span>
          </div>
          <p>{position.description}</p>
          {['responsibilities', 'requirements', 'preferredQualifications', 'benefits'].map((key) => (
            (position[key] || []).length > 0 && (
              <section className="career-list-section" key={key}>
                <h2>{statusLabel(key)}</h2>
                <ul>
                  {position[key].map((item, index) => <li key={`${key}-${index}`}>{item.text || item}</li>)}
                </ul>
              </section>
            )
          ))}
        </article>

        <aside className="dashboard-section career-apply-panel">
          <h2>Apply</h2>
          {position.applicationMethod === 'external' ? (
            <a className="button primary" href={position.externalApplyUrl} target="_blank" rel="noreferrer">Apply Externally</a>
          ) : position.applicationsOpen ? (
            <form className="profile-form" onSubmit={submit}>
              <div className="form-grid two">
                {['firstName', 'lastName', 'email', 'phone', 'country', 'city'].map((field) => (
                  <label key={field}>
                    {statusLabel(field)}
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      value={form[field]}
                      onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                      required={['firstName', 'lastName', 'email'].includes(field)}
                    />
                  </label>
                ))}
              </div>
              <label>
                Current position
                <input value={form.currentPosition} onChange={(event) => setForm({ ...form, currentPosition: event.target.value })} />
              </label>
              <label>
                Portfolio or LinkedIn
                <input value={form.portfolio} onChange={(event) => setForm({ ...form, portfolio: event.target.value })} />
              </label>
              <label>
                Cover note
                <textarea value={form.coverNote} onChange={(event) => setForm({ ...form, coverNote: event.target.value })} />
              </label>
              {customFields.map((field) => (
                <label key={field.key}>
                  {field.label}
                  <input value={form[field.key] || ''} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} required={field.required} />
                </label>
              ))}
              <label className="file-input-label">
                <UploadCloud size={18} /> Resume
                <input type="file" accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp" onChange={(event) => setFiles({ ...files, resume: event.target.files?.[0] })} />
              </label>
              {notice && <p className="form-success"><CheckCircle2 size={16} /> {notice}</p>}
              {error && <p className="form-error">{error}</p>}
              <button className="button primary" type="submit" disabled={submitting}>
                {submitting ? <LoaderCircle className="spin" size={18} /> : <Send size={18} />}
                Submit Application
              </button>
            </form>
          ) : (
            <p>Applications are closed for this role.</p>
          )}
        </aside>
      </section>
    </main>
  );
};
