import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle, CreditCard } from 'lucide-react';
import { bookConsultation, getConsultants } from '../api/client.js';
import { ConsultantCard } from '../components/ConsultantCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const Consultations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [consultants, setConsultants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    service: 'CEO PLC project advisory',
    category: 'PLC & Industrial Automation',
    scheduledAt: '',
    provider: 'stripe',
    notes: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    getConsultants().then((data) => {
      setConsultants(data.consultants || []);
      setSelected(data.consultants?.[0] || null);
    });
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: '/consultations' } });
      return;
    }

    await bookConsultation({
      consultantId: selected?._id || selected?.id,
      ...form
    });

    setMessage('Consulting request confirmed. Payment recorded and confirmation email queued.');
  };

  return (
    <main className="section page">
      <div className="page-heading">
        <p className="eyebrow">CEO Consulting</p>
        <h1>Bring PLC project and research questions to the PlaneForge CEO</h1>
        <p>Companies can request advisory time for PLC projects, automation research, feasibility, troubleshooting, and implementation planning.</p>
      </div>

      <section className="consultation-layout">
        <div className="consultant-list">
          {consultants.map((consultant) => (
            <ConsultantCard key={consultant._id || consultant.id} consultant={consultant} onSelect={setSelected} />
          ))}
        </div>

        <form className="booking-panel" onSubmit={submit}>
          <p className="eyebrow">Selected advisor</p>
          {selected && (
            <div className="selected-consultant">
              <img src={selected.avatar} alt="" />
              <div>
                <h2>{selected.name}</h2>
                <p>{selected.specialty}</p>
                <strong>${selected.consultationFee}/consultation</strong>
              </div>
            </div>
          )}

          <label>
            Service
            <select value={form.service} onChange={(event) => update('service', event.target.value)}>
              <option>CEO PLC project advisory</option>
              <option>Automation research and feasibility review</option>
              <option>Controls architecture review</option>
              <option>PLC troubleshooting strategy</option>
              <option>Technical proposal and project scoping</option>
            </select>
          </label>

          <label>
            Category
            <select value={form.category} onChange={(event) => update('category', event.target.value)}>
              <option>PLC & Industrial Automation</option>
              <option>Control Systems Research</option>
              <option>Manufacturing Automation</option>
              <option>HMI & SCADA</option>
              <option>Project Feasibility</option>
            </select>
          </label>

          <label>
            Date and time
            <input type="datetime-local" value={form.scheduledAt} onChange={(event) => update('scheduledAt', event.target.value)} required />
          </label>

          <fieldset className="segmented">
            <legend>Payment gateway</legend>
            {['stripe', 'paystack'].map((item) => (
              <label key={item}>
                <input type="radio" name="consultation-provider" value={item} checked={form.provider === item} onChange={(event) => update('provider', event.target.value)} />
                <span>{item}</span>
              </label>
            ))}
          </fieldset>

          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="Briefly describe the company, PLC system, project, research need, timeline, or technical decision."
            />
          </label>

          <button className="button primary full" type="submit">
            <CalendarDays size={18} />
            Request CEO Consulting
          </button>
          <p className="secure-note">
            <CreditCard size={16} /> Payment is verified before the consulting request is confirmed.
          </p>
          {message && (
            <p className="form-success">
              <CheckCircle size={16} /> {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
};
