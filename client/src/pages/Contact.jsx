import { useMemo, useState } from 'react';
import { Building2, GraduationCap, Handshake, Mail, MessageSquareText, Send } from 'lucide-react';
import { submitContactInquiry } from '../api/client.js';

const intentOptions = [
  {
    value: 'learner',
    label: 'Learner',
    description: 'Courses, PCB learning path, enrollment, certificates, or where to begin.',
    icon: GraduationCap,
    topics: ['Choosing a PCB course', 'Course content question', 'Enrollment or account help', 'Certificate question']
  },
  {
    value: 'b2b',
    label: 'Company / B2B',
    description: 'Training, team learning, project support, or company request.',
    icon: Building2,
    topics: ['Team PCB training', 'Company project support', 'Hardware product planning', 'Custom learning package']
  },
  {
    value: 'collaboration',
    label: 'Collaboration',
    description: 'Content, education, research, community, or technical collaboration.',
    icon: Handshake,
    topics: ['Education collaboration', 'Research collaboration', 'Content partnership', 'Community program']
  },
  {
    value: 'consulting',
    label: 'Consulting',
    description: 'PCB project planning, architecture review, troubleshooting, or build support.',
    icon: MessageSquareText,
    topics: ['PCB project review', 'Schematic or layout architecture', 'Troubleshooting support', 'Product build support']
  },
  {
    value: 'partnership',
    label: 'Partnership',
    description: 'Business, distribution, institutional, or long-term partnership.',
    icon: Handshake,
    topics: ['Institutional partnership', 'Training distribution', 'Business partnership', 'Sponsorship']
  },
  {
    value: 'general',
    label: 'General',
    description: 'Anything else PlaneForge should know.',
    icon: Mail,
    topics: ['General question', 'Media inquiry', 'Feedback', 'Other']
  }
];

const initialForm = {
  intent: 'learner',
  topic: 'Choosing a PCB course',
  customTopic: '',
  name: '',
  email: '',
  organization: '',
  role: '',
  subject: '',
  message: ''
};

export const Contact = () => {
  const [form, setForm] = useState(initialForm);
  const [topicMode, setTopicMode] = useState('selected');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedIntent = useMemo(
    () => intentOptions.find((item) => item.value === form.intent) || intentOptions[0],
    [form.intent]
  );

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const selectIntent = (intent) => {
    const nextIntent = intentOptions.find((item) => item.value === intent) || intentOptions[0];
    setForm((current) => ({
      ...current,
      intent,
      topic: nextIntent.topics[0],
      customTopic: ''
    }));
    setTopicMode('selected');
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        topic: topicMode === 'selected' ? form.topic : '',
        customTopic: topicMode === 'custom' ? form.customTopic : ''
      };

      const data = await submitContactInquiry(payload);
      setMessage(data.message || 'Inquiry received. PlaneForge will respond by email.');
      setForm({
        ...initialForm,
        intent: form.intent,
        topic: selectedIntent.topics[0]
      });
      setTopicMode('selected');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="section page contact-page">
      <div className="page-heading">
        <p className="eyebrow">Contact PlaneForge</p>
        <h1>Tell us what you need, and we will route it clearly</h1>
        <p>
          Learners, companies, collaborators, and partners can send focused PCB course or project
          inquiries with the right category attached from the start.
        </p>
      </div>

      <section className="contact-grid contact-methods">
        <article>
          <Mail size={22} />
          <h2>Email</h2>
          <p>planeforge1@gmail.com</p>
        </article>
        <article>
          <MessageSquareText size={22} />
          <h2>Inquiry Routing</h2>
          <p>Messages are grouped by intent and topic so PlaneForge can review them faster.</p>
        </article>
      </section>

      <form className="contact-form contact-intent-form" onSubmit={submit}>
        <section className="intent-picker" aria-label="Inquiry intent">
          {intentOptions.map(({ value, label, description, icon: Icon }) => (
            <button
              className={form.intent === value ? 'active' : ''}
              type="button"
              key={value}
              onClick={() => selectIntent(value)}
            >
              <Icon size={20} />
              <span>
                {label}
                <small>{description}</small>
              </span>
            </button>
          ))}
        </section>

        <section className="contact-form-fields">
          <div className="topic-row">
            <label>
              Topic
              {topicMode === 'selected' ? (
                <select value={form.topic} onChange={(event) => update('topic', event.target.value)}>
                  {selectedIntent.topics.map((topic) => (
                    <option value={topic} key={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.customTopic}
                  onChange={(event) => update('customTopic', event.target.value)}
                  placeholder="Type your topic"
                  required
                />
              )}
            </label>
            <button
              className="button ghost small"
              type="button"
              onClick={() => setTopicMode((current) => (current === 'selected' ? 'custom' : 'selected'))}
            >
              {topicMode === 'selected' ? 'Type Topic' : 'Use List'}
            </button>
          </div>

          <div className="contact-two-column">
            <label>
              Name
              <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Your name" required />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(event) => update('email', event.target.value)} type="email" placeholder="you@example.com" required />
            </label>
          </div>

          <div className="contact-two-column">
            <label>
              Organization
              <input value={form.organization} onChange={(event) => update('organization', event.target.value)} placeholder="School, company, or team" />
            </label>
            <label>
              Role
              <input value={form.role} onChange={(event) => update('role', event.target.value)} placeholder="Learner, founder, engineer, manager" />
            </label>
          </div>

          <label>
            Subject
            <input value={form.subject} onChange={(event) => update('subject', event.target.value)} placeholder="Short summary" required />
          </label>
          <label>
            Message
            <textarea
              value={form.message}
              onChange={(event) => update('message', event.target.value)}
              placeholder="Share the course question, collaboration idea, company need, timeline, or PCB project context."
              required
            />
          </label>

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button className="button primary" type="submit" disabled={submitting}>
            <Send size={18} />
            {submitting ? 'Sending' : 'Send Inquiry'}
          </button>
        </section>
      </form>
    </main>
  );
};
