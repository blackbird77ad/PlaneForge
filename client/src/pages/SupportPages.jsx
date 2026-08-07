import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle,
  FileText,
  Mail,
  ShieldCheck,
  Users
} from 'lucide-react';
import { testimonials } from '../data/catalog.js';

const faqs = [
  {
    question: 'Who are PlaneForge courses for?',
    answer:
      'The courses are for beginners, students, makers, embedded developers, engineers, founders, and teams who want practical PCB design experience.'
  },
  {
    question: 'Are the courses project-based?',
    answer:
      'Yes. Every course is organized around a board project, design decisions, manufacturing outputs, and bring-up practice.'
  },
  {
    question: 'Can PlaneForge support more than 1,000 learners from launch?',
    answer:
      'The public catalog, account flow, checkout, dashboards, and content structure are designed for large learner cohorts and future catalog growth.'
  },
  {
    question: 'Do courses include certificates?',
    answer:
      'Most courses include a project certificate tied to completed lessons and practical course outcomes.'
  },
  {
    question: 'Can a company book PCB consulting?',
    answer:
      'Yes. Companies can book support for board architecture, product planning, feasibility, DFM, troubleshooting, and implementation decisions.'
  },
  {
    question: 'What payment providers are supported?',
    answer:
      'The platform includes Stripe and Paystack flows, with mock verification available for local development.'
  }
];

const helpCards = [
  {
    title: 'Course Guidance',
    text: 'Ask for help choosing a PCB track, difficulty level, or first project.',
    to: '/contact',
    icon: BookOpen
  },
  {
    title: 'Enrollment Support',
    text: 'Get help with checkout, payment verification, account access, or certificates.',
    to: '/contact',
    icon: ShieldCheck
  },
  {
    title: 'Company Requests',
    text: 'Route team training, consulting, product build, and collaboration needs.',
    to: '/consultations',
    icon: Users
  }
];

const terms = [
  {
    title: 'Accounts',
    text:
      'Learners are responsible for keeping account credentials private. One verified account session is intended for the enrolled learner.'
  },
  {
    title: 'Course Access',
    text:
      'Course access begins after payment verification or approved admin enrollment. Access may include videos, project files, checklists, and certificates.'
  },
  {
    title: 'Acceptable Use',
    text:
      'Do not share private course streams, abuse platform systems, attempt unauthorized access, or reuse PlaneForge content outside your permitted learning use.'
  },
  {
    title: 'Consulting',
    text:
      'Consulting requests should include accurate project context. PlaneForge may request additional information before technical recommendations are finalized.'
  }
];

const privacy = [
  {
    title: 'Information Collected',
    text:
      'PlaneForge collects information needed for accounts, enrollment, payments, course progress, certificates, newsletter subscriptions, and contact inquiries.'
  },
  {
    title: 'How It Is Used',
    text:
      'Information is used to provide learning access, verify payments, protect streaming sessions, respond to inquiries, and improve the platform.'
  },
  {
    title: 'Payment Data',
    text:
      'Payment processing is handled through supported providers. PlaneForge stores payment status and references, not full card details.'
  },
  {
    title: 'Contact',
    text:
      'Privacy questions can be sent through the contact page or by email to planeforge1@gmail.com.'
  }
];

const refunds = [
  {
    title: 'Course Purchases',
    text:
      'Refund requests are reviewed by course access status, payment verification, and the amount of content consumed.'
  },
  {
    title: 'Duplicate Payments',
    text:
      'Duplicate or accidental payments should be reported with the account email, course name, provider, and payment reference.'
  },
  {
    title: 'Consulting Bookings',
    text:
      'Consulting changes should be requested before the scheduled session. Completed consulting sessions are reviewed case by case.'
  },
  {
    title: 'How to Request',
    text:
      'Use the contact page with the Refund topic and include your order details so PlaneForge can review the request.'
  }
];

const PageHero = ({ eyebrow, title, text, icon: Icon = FileText }) => (
  <section className="public-hero">
    <div className="section-inner public-hero-grid">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      <div className="public-hero-panel">
        <Icon size={34} />
        <strong>PlaneForge Academy</strong>
        <p>Public information for PCB learners, companies, collaborators, and partners.</p>
      </div>
    </div>
  </section>
);

const InfoGrid = ({ items }) => (
  <div className="info-grid">
    {items.map(({ title, text }) => (
      <article key={title}>
        <CheckCircle size={22} />
        <h2>{title}</h2>
        <p>{text}</p>
      </article>
    ))}
  </div>
);

export const Faq = () => (
  <main className="public-page">
    <PageHero
      eyebrow="FAQ"
      title="Answers before you enroll, book, or build"
      text="Quick answers about PCB courses, certificates, consulting, payments, and learner access."
      icon={BookOpen}
    />
    <section className="section public-section">
      <div className="faq-list">
        {faqs.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  </main>
);

export const Help = () => (
  <main className="public-page">
    <PageHero
      eyebrow="Help Center"
      title="Get routed to the right PlaneForge support path"
      text="Find course guidance, enrollment support, company consulting, and direct contact options."
      icon={ShieldCheck}
    />
    <section className="section public-section">
      <div className="help-grid">
        {helpCards.map(({ title, text, to, icon: Icon }) => (
          <article key={title}>
            <Icon size={28} />
            <h2>{title}</h2>
            <p>{text}</p>
            <Link className="button ghost small" to={to}>
              Open
              <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </div>
      <div className="support-strip">
        <Mail size={22} />
        <span>Email PlaneForge directly at planeforge1@gmail.com</span>
        <Link className="button primary small" to="/contact">
          Contact
        </Link>
      </div>
    </section>
  </main>
);

export const Terms = () => (
  <main className="public-page">
    <PageHero
      eyebrow="Terms"
      title="Clear expectations for learning, access, and consulting"
      text="These terms summarize how PlaneForge course access, platform use, and consulting requests are intended to work."
      icon={FileText}
    />
    <section className="section public-section">
      <InfoGrid items={terms} />
    </section>
  </main>
);

export const Privacy = () => (
  <main className="public-page">
    <PageHero
      eyebrow="Privacy"
      title="Practical privacy notes for PlaneForge users"
      text="A plain-language overview of the information PlaneForge uses to operate learning, payment, progress, and inquiry workflows."
      icon={ShieldCheck}
    />
    <section className="section public-section">
      <InfoGrid items={privacy} />
    </section>
  </main>
);

export const Refunds = () => (
  <main className="public-page">
    <PageHero
      eyebrow="Refund Policy"
      title="Refund requests are reviewed with payment and access context"
      text="Use this page to understand the refund review process before contacting support."
      icon={CalendarDays}
    />
    <section className="section public-section">
      <InfoGrid items={refunds} />
      <div className="support-strip">
        <FileText size={22} />
        <span>Include your account email, course name, payment provider, and payment reference.</span>
        <Link className="button primary small" to="/contact">
          Request Review
        </Link>
      </div>
    </section>
  </main>
);

export const Testimonials = () => (
  <main className="public-page testimonials-page">
    <PageHero
      eyebrow="Testimonials"
      title="Learners use PlaneForge to build repeatable PCB skill"
      text="Stories from students, developers, and hardware teams using project-based PCB courses."
      icon={Award}
    />
    <section className="section public-section">
      <div className="home-testimonial-grid public-testimonial-grid">
        {testimonials.map((item) => (
          <article key={item.name}>
            <span className="quote-mark">"</span>
            <p>{item.quote}</p>
            <div>
              <img src={item.avatar} alt="" loading="lazy" decoding="async" />
              <span>
                <strong>{item.name}</strong>
                <small>{item.role}</small>
              </span>
              <em>{item.result}</em>
            </div>
          </article>
        ))}
      </div>
      <div className="support-strip">
        <BookOpen size={22} />
        <span>Ready to build a real board with structured guidance?</span>
        <Link className="button primary small" to="/courses">
          Explore Courses
        </Link>
      </div>
    </section>
  </main>
);
