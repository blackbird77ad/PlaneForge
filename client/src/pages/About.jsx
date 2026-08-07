import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  CircuitBoard,
  Factory,
  GraduationCap,
  Layers,
  ShieldCheck,
  Users
} from 'lucide-react';
import { benefits, publicStats } from '../data/catalog.js';

const values = [
  {
    title: 'Real board learning',
    text: 'Students learn PCB design by building boards, reviewing design decisions, creating fabrication files, and planning bring-up.',
    icon: CircuitBoard
  },
  {
    title: 'Scalable learner systems',
    text: 'The public catalog, filters, checkout path, certificates, and dashboards are shaped for cohorts that start large and keep growing.',
    icon: Users
  },
  {
    title: 'Engineering review culture',
    text: 'PlaneForge teaches the habits that keep hardware projects healthy: documentation, checklists, DFM review, and test plans.',
    icon: ShieldCheck
  },
  {
    title: 'Company build support',
    text: 'Teams can bring PCB products, prototypes, research questions, and troubleshooting work to PlaneForge for practical guidance.',
    icon: Factory
  }
];

const timeline = [
  {
    title: 'Learn',
    text: 'Choose a PCB track and move through projects that build from fundamentals to advanced board work.'
  },
  {
    title: 'Build',
    text: 'Create schematics, layouts, manufacturing files, and bring-up notes that can be reviewed and reused.'
  },
  {
    title: 'Prove',
    text: 'Earn certificates tied to completed PCB projects and practical documentation.'
  },
  {
    title: 'Scale',
    text: 'Use team training, consulting, and structured project reviews when the hardware work gets bigger.'
  }
];

export const About = () => (
  <main className="public-page about-page">
    <section className="public-hero">
      <div className="section-inner public-hero-grid">
        <div>
          <p className="eyebrow">About PlaneForge</p>
          <h1>PCB education built around real boards, not passive watching</h1>
          <p>
            PlaneForge Academy helps learners, founders, engineers, and companies build practical
            PCB design skill through structured projects, fabrication-ready outputs, and clear
            technical review habits.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/courses">
              Explore Courses
              <ArrowRight size={18} />
            </Link>
            <Link className="button ghost" to="/consultations">
              Consult PlaneForge
            </Link>
          </div>
        </div>
        <div className="public-hero-panel readable-hero-panel">
          <GraduationCap size={34} />
          <strong>Easy to navigate</strong>
          <p>
            Students can find a PCB track, enroll, and continue learning without confusion.
          </p>
        </div>
      </div>
    </section>

    <section className="stats-strip">
      <div className="section-inner stats-grid">
        {publicStats.map((item) => (
          <article key={item.label}>
            <Award size={28} />
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
    </section>

    <section className="section public-section">
      <div className="section-heading">
        <p className="eyebrow">What We Believe</p>
        <h2>PCB skill grows fastest when every lesson has a board-level outcome</h2>
        <p>
          The platform keeps course discovery, project learning, certificates, and consulting tied
          to practical hardware work.
        </p>
      </div>
      <div className="value-grid public-value-grid">
        {values.map(({ title, text, icon: Icon }) => (
          <article key={title}>
            <Icon size={26} />
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="section public-section split-public-band">
      <div>
        <p className="eyebrow">Operating Model</p>
        <h2>Courses, certificates, and consulting share one practical backbone</h2>
        <p>
          PlaneForge is not just a catalog. It is a project workflow: pick a board, understand the
          constraints, design the PCB, review the output, and know what to do when the physical
          board arrives.
        </p>
        <div className="benefit-cloud">
          {benefits.map((benefit) => (
            <span key={benefit}>{benefit}</span>
          ))}
        </div>
      </div>
      <div className="timeline-list">
        {timeline.map(({ title, text }, index) => (
          <article key={title}>
            <span>{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className="newsletter-cta public-final-cta">
      <div className="section-inner newsletter-grid">
        <div className="newsletter-icon">
          <BookOpen size={34} />
        </div>
        <div>
          <h2>Start with a real PCB project</h2>
          <p>Move from first board confidence to advanced hardware review one project at a time.</p>
        </div>
        <Link className="button primary" to="/courses">
          View PCB Catalog
          <Layers size={18} />
        </Link>
      </div>
    </section>
  </main>
);
