import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { courses, heroImage } from '../data/catalog.js';
import { NewsletterForm } from '../components/NewsletterForm.jsx';

const formatMoney = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const featuredCourses = courses.slice(0, 6);

const trustItems = [
  { label: 'Project-Based Training', icon: BookOpen },
  { label: '51+ PCB Courses', icon: Award },
  { label: 'Flexible Self-Paced Learning', icon: Clock },
  { label: 'Project Certificates', icon: FileText }
];

const missionFeatures = [
  {
    title: 'PCB-Focused Courses',
    text: 'Project-based lessons built around real schematics, layouts, footprints, and fabrication-ready Gerbers.',
    icon: BookOpen
  },
  {
    title: 'Real Board-Building Practice',
    text: 'Practice the actual workflows PCB designers use: schematic capture, layout, routing, DFM checks, and bring-up.',
    icon: ShieldCheck
  },
  {
    title: 'Flexible Technical Learning',
    text: 'Study PCB design concepts at your own pace with practical modules and lifetime access to course materials.',
    icon: Clock
  },
  {
    title: 'Project-Ready Certificates',
    text: 'Earn certificates tied to real, completed PCB builds - not just video-watching.',
    icon: FileText
  }
];

const consultationCards = [
  {
    title: 'PCB Project Builds',
    text: 'Bring PCB systems, product ideas, hardware constraints, and implementation decisions to PlaneForge.',
    icon: BriefcaseBusiness
  },
  {
    title: 'Research & Feasibility',
    text: 'Pressure-test hardware ideas, component choices, board architecture, and project assumptions.',
    icon: ShieldCheck
  },
  {
    title: 'Implementation & Troubleshooting',
    text: 'Get support for schematic/layout review, DFM checks, bring-up, troubleshooting, and delivery risk.',
    icon: Award
  }
];

export const Home = () => {
  return (
    <main className="home-page">
      <section className="pf-hero">
        <div className="hero-circuit hero-circuit-left" aria-hidden="true" />
        <div className="hero-circuit hero-circuit-right" aria-hidden="true" />
        <div className="section-inner hero-grid">
          <div className="hero-copy">
            <p className="hero-badge">PlaneForge Academy</p>
            <h1>
              PCB Design Training. Real Boards. <span>Real Skills.</span>
            </h1>
            <p>
              Master PCB design through hands-on, project-based courses. PlaneForge Academy
              teaches PCB (printed circuit board) design and hardware engineering through
              hands-on, project-based courses. Students learn by building real boards, from dev
              boards and sensor breakouts to flight controllers and FPGA boards, rather than
              watching lectures alone.
            </p>
            <div className="hero-actions">
              <Link className="button primary" to="/courses">
                Explore PCB Courses
                <ArrowRight size={18} />
              </Link>
              <Link className="button outline-light" to="/consultations">
                Consult PlaneForge
                <CalendarDays size={18} />
              </Link>
            </div>
            <div className="hero-trust-row">
              {trustItems.map(({ label, icon: Icon }) => (
                <span key={label}>
                  <Icon size={16} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-glow" />
            <img src={heroImage} alt="Printed circuit board design and hardware engineering work" />
            <div className="hero-mini-card hero-mini-card-top">
              <BookOpen size={19} />
              PCB Learning
            </div>
            <div className="hero-mini-card hero-mini-card-bottom">
              <Award size={19} />
              Real Board Builds
            </div>
          </div>
        </div>
      </section>

      <section className="home-section courses-showcase">
        <div className="section-inner">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">PCB Courses</p>
              <h2>Build practical PCB design skills, one real board at a time.</h2>
            </div>
            <Link className="button ghost small" to="/courses">
              View All PCB Courses
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="home-course-grid">
            {featuredCourses.map((course) => (
              <article className="home-course-card" key={course.slug}>
                <div className="course-thumb">
                  <img src={course.thumbnail} alt="" />
                  <span>{course.category}</span>
                </div>
                <div className="home-course-body">
                  <h3>{course.title}</h3>
                  <div className="course-price-row">
                    <span>{course.difficulty}</span>
                    <strong>{formatMoney(course.price, course.currency)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section mission-section">
        <div className="section-inner mission-grid">
          <div className="mission-copy">
            <p className="eyebrow">Why Choose PlaneForge Academy</p>
            <h2>Focused on hands-on PCB education and company consulting</h2>
            <p>
              We provide practical PCB education, consulting, and build support for companies
              working on hardware projects, products, research, feasibility, and technical decisions.
            </p>
            <Link className="button primary" to="/about">
              Learn More About Us
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="mission-feature-grid">
            {missionFeatures.map(({ title, text, icon: Icon }) => (
              <article key={title}>
                <Icon size={28} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="consultation-band">
        <div className="section-inner consultation-grid">
          <div>
            <p className="eyebrow">PlaneForge Consulting</p>
            <h2>Companies consult with PlaneForge for PCB projects, products, and builds</h2>
            <p>
              PlaneForge is well versed in PCB project planning, hardware research, schematic and
              layout architecture, product builds, troubleshooting, and implementation decisions.
            </p>
            <Link className="button primary" to="/consultations">
              Consult PlaneForge
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="consultation-card-grid">
            {consultationCards.map(({ title, text, icon: Icon }) => (
              <article key={title}>
                <Icon size={32} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="newsletter-cta">
        <div className="section-inner newsletter-grid">
          <div className="newsletter-icon">
            <FileText size={34} />
          </div>
          <div>
            <h2>Stay Updated with PlaneForge Academy</h2>
            <p>Subscribe to get new course announcements, PCB design tips, and early access to new content.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
};
