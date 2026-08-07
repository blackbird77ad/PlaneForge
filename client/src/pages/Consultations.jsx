import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  FileSearch,
  Layers,
  Mail,
  Send,
  ShieldCheck,
  UserRound,
  Wrench
} from 'lucide-react';
import { submitContactInquiry } from '../api/client.js';

const services = [
  {
    id: 'project-builds',
    title: 'PCB Project Builds',
    text: 'Scope boards, define architecture, review component choices, and move from idea to fabrication-ready files.',
    icon: Layers
  },
  {
    id: 'research',
    title: 'Research & Feasibility',
    text: 'Pressure-test a product idea, identify technical risks, compare parts, and plan a path before budget is spent.',
    icon: FileSearch
  },
  {
    id: 'implementation',
    title: 'Implementation Support',
    text: 'Get help with schematic review, layout review, DFM, board bring-up, troubleshooting, and revision planning.',
    icon: Wrench
  }
];

const serviceOptions = [
  'PCB project review and build planning',
  'Hardware product feasibility review',
  'Schematic and layout architecture review',
  'Manufacturing package and DFM review',
  'Board bring-up and troubleshooting support',
  'Team PCB training consultation'
];

const categoryOptions = [
  'PCB Design & Hardware Engineering',
  'Embedded Systems',
  'Power Electronics',
  'High-Speed & Mixed-Signal',
  'FPGA & Digital Hardware',
  'Drone, Robotics, or IoT Hardware'
];

const consultantName = 'Dr. Honu Evans';

export const Consultations = () => {
  const [form, setForm] = useState({
    service: serviceOptions[0],
    category: categoryOptions[0],
    name: '',
    email: '',
    organization: '',
    timeline: '',
    notes: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    try {
      await submitContactInquiry({
        intent: 'consulting',
        topic: form.service,
        name: form.name,
        email: form.email,
        organization: form.organization,
        role: '',
        subject: `Consulting quote request: ${form.service}`,
        message: [
          `Consultant requested: ${consultantName}`,
          `Service: ${form.service}`,
          `Category: ${form.category}`,
          `Timeline: ${form.timeline || 'Not specified'}`,
          `Details: ${form.notes}`
        ].join('\n')
      });

      setMessage('Quote request sent. Dr. Honu Evans will follow up by email to discuss scope and pricing.');
      setForm({
        service: serviceOptions[0],
        category: categoryOptions[0],
        name: '',
        email: '',
        organization: '',
        timeline: '',
        notes: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="public-page consultations-page">
      <section className="public-hero">
        <div className="section-inner public-hero-grid">
          <div>
            <p className="eyebrow">PlaneForge Consulting</p>
            <h1>Bring PCB projects, products, and hardware decisions to PlaneForge</h1>
            <p>
              Companies use PlaneForge for PCB project planning, hardware research, product builds,
              schematic and layout review, troubleshooting, and implementation decisions.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#booking">
                Request a Quote
                <CalendarDays size={18} />
              </a>
              <Link className="button ghost" to="/contact">
                Send Inquiry
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <div className="public-hero-panel">
            <ShieldCheck size={34} />
            <strong>Built for serious hardware work</strong>
            <p>
              Use consulting before a fabrication order, technical proposal, board revision, or
              team training rollout.
            </p>
          </div>
        </div>
      </section>

      <section className="section public-section">
        <div className="section-heading">
          <p className="eyebrow">Consulting Areas</p>
          <h2 className="readable-page-title">
            Focused support for the points where{' '}
            <span>PCB projects usually slow down</span>
          </h2>
        </div>
        <div className="consult-service-grid">
          {services.map(({ id, title, text, icon: Icon }) => (
            <article id={id} key={id}>
              <Icon size={28} />
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section public-section consultation-layout" id="booking">
        <div>
          <div className="section-heading compact-heading">
            <p className="eyebrow">Consultant</p>
            <h2>Discuss the project first, then receive the right consulting quote</h2>
            <p>
              PlaneForge consulting is handled by one consultant, {consultantName}. Send the project
              context first, then continue by email to confirm scope, timeline, and pricing.
            </p>
          </div>
          <div className="single-consultant-card">
            <div className="consultant-avatar-caramel" aria-hidden="true">
              <UserRound size={40} strokeWidth={1.8} />
            </div>
            <div>
              <span>Admin & Consultant</span>
              <h3>{consultantName}</h3>
              <p>
                PCB project planning, hardware feasibility, schematic and layout review, DFM,
                troubleshooting, and implementation support.
              </p>
              <strong>Pricing is confirmed after scope review.</strong>
            </div>
          </div>
        </div>

        <form className="booking-panel" onSubmit={submit}>
          <p className="eyebrow">Quote Request</p>

          <div className="contact-two-column">
            <label>
              Name
              <input value={form.name} onChange={(event) => update('name', event.target.value)} required />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(event) => update('email', event.target.value)} type="email" required />
            </label>
          </div>

          <label>
            Organization
            <input
              value={form.organization}
              onChange={(event) => update('organization', event.target.value)}
              placeholder="Company, school, lab, or team"
            />
          </label>

          <label>
            Service
            <select value={form.service} onChange={(event) => update('service', event.target.value)}>
              {serviceOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Category
            <select value={form.category} onChange={(event) => update('category', event.target.value)}>
              {categoryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Timeline
            <input
              value={form.timeline}
              onChange={(event) => update('timeline', event.target.value)}
              placeholder="Example: this week, before fabrication, Q1 project"
            />
          </label>

          <label>
            Project details
            <textarea
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="Briefly describe the board, product, company need, timeline, constraints, or technical decision."
              required
            />
          </label>

          <button className="button primary full" type="submit" disabled={submitting}>
            <Send size={18} />
            {submitting ? 'Sending Request' : 'Send Quote Request'}
          </button>
          <p className="secure-note quote-note">
            <Mail size={16} /> Dr. Honu Evans will continue the discussion by email before pricing is confirmed.
          </p>
          {message && (
            <p className="form-success">
              <CheckCircle size={16} /> {message}
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
        </form>
      </section>
    </main>
  );
};
