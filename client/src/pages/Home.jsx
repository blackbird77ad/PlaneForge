import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  CreditCard,
  FileText,
  ShieldCheck,
  Star,
  UserRound,
  Users
} from 'lucide-react';
import { articles, courses, heroImage, testimonials } from '../data/catalog.js';
import { NewsletterForm } from '../components/NewsletterForm.jsx';

const formatMoney = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const featuredCourses = courses.slice(0, 4);

const trustItems = [
  { label: 'PLC-First Training', icon: BookOpen },
  { label: 'CEO Advisory', icon: ShieldCheck },
  { label: 'Flexible Learning', icon: Clock },
  { label: 'Project Certificates', icon: Award }
];

const missionFeatures = [
  {
    title: 'PLC-Focused Courses',
    text: 'Programmable Logic Controller lessons built around real control panels, I/O, ladder logic, and commissioning.',
    icon: BookOpen
  },
  {
    title: 'Real Controls Practice',
    text: 'Practice the workflows technicians and engineers use to wire, program, test, and troubleshoot PLC systems.',
    icon: UserRound
  },
  {
    title: 'Flexible Technical Learning',
    text: 'Study PLC concepts at your own pace with practical modules and lifetime access to materials.',
    icon: Clock
  },
  {
    title: 'Project-Ready Certificates',
    text: 'Earn certificates that point to hands-on PLC skills and practical automation outcomes.',
    icon: FileText
  },
  {
    title: 'CEO Consulting',
    text: 'Companies can reach the PlaneForge CEO for PLC project scoping, research, and technical advisory work.',
    icon: CalendarDays
  },
  {
    title: 'Company Research Support',
    text: 'Get help clarifying automation ideas, implementation risks, and the technical path before teams commit budget.',
    icon: Users
  }
];

const consultationCards = [
  {
    title: 'Company Project Advisory',
    text: 'Bring PLC project questions, plant constraints, and implementation decisions to the CEO.',
    icon: BriefcaseBusiness
  },
  {
    title: 'Research & Feasibility',
    text: 'Pressure-test automation ideas, equipment choices, control architecture, and project assumptions.',
    icon: ShieldCheck
  },
  {
    title: 'PLC Implementation Review',
    text: 'Review logic, I/O, commissioning plans, troubleshooting strategy, and delivery risks.',
    icon: Award
  }
];

const stats = [
  ['3,000+', 'PLC Learners'],
  ['42+', 'PLC Lessons & Labs'],
  ['25+', 'Company Consultations'],
  ['1,200+', 'Certificates Issued']
];

export const Home = () => {
  return (
    <main className="home-page">
      <section className="pf-hero">
        <div className="hero-circuit hero-circuit-left" aria-hidden="true" />
        <div className="hero-circuit hero-circuit-right" aria-hidden="true" />
        <div className="section-inner hero-grid">
          <div className="hero-copy">
            <p className="hero-badge">PLC Training. CEO-Led Consulting.</p>
            <h1>
              Master PLC systems for real <span>automation work.</span>
            </h1>
            <p>
              PlaneForge Academy focuses on Programmable Logic Controller (PLC) training and
              CEO-led consulting for companies that need project scoping, automation research,
              troubleshooting, and implementation support.
            </p>
            <div className="hero-actions">
              <Link className="button primary" to="/courses">
                Explore PLC Courses
                <ArrowRight size={18} />
              </Link>
              <Link className="button outline-light" to="/consultations">
                Request CEO Consulting
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
            <img src={heroImage} alt="Engineer working on industrial automation and PLC controls" />
            <div className="hero-mini-card hero-mini-card-top">
              <CreditCard size={19} />
              PLC Learning
            </div>
            <div className="hero-mini-card hero-mini-card-bottom">
              <Award size={19} />
              CEO Advisory
            </div>
          </div>
        </div>
      </section>

      <section className="home-section courses-showcase">
        <div className="section-inner">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">PLC Courses</p>
              <h2>Build practical Programmable Logic Controller skills</h2>
            </div>
            <Link className="button ghost small" to="/courses">
              View PLC Courses
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="home-course-grid">
            {featuredCourses.map((course) => (
              <article className="home-course-card" key={course.slug}>
                <div className="course-thumb">
                  <img src={course.thumbnail} alt="" />
                  <span>{course.discipline.split(' ')[0]}</span>
                </div>
                <div className="home-course-body">
                  <h3>{course.title}</h3>
                  <div className="instructor-line">
                    <img src={course.instructor?.avatar} alt="" />
                    <span>{course.instructorName}</span>
                  </div>
                  <div className="course-card-meta">
                    <span>
                      <Star size={15} fill="currentColor" /> {course.rating}
                    </span>
                    <span>
                      <Users size={15} /> {course.studentsEnrolled.toLocaleString()} Students
                    </span>
                  </div>
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
            <p className="eyebrow">Why Choose PlaneForge</p>
            <h2>Focused on PLC learning and company consulting</h2>
            <p>
              We provide practical PLC education and CEO-led consulting for companies that need
              help with automation projects, research, feasibility, and technical decisions.
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
            <p className="eyebrow">CEO Consulting</p>
            <h2>Companies can bring PLC projects to the PlaneForge CEO</h2>
            <p>
              Request advisory support for PLC project planning, controls research, architecture
              review, troubleshooting strategy, and implementation decisions.
            </p>
            <Link className="button primary" to="/consultations">
              Request Consulting
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

      <section className="stats-strip">
        <div className="section-inner stats-grid">
          {stats.map(([value, label], index) => (
            <article key={label}>
              {index === 0 && <Users size={34} />}
              {index === 1 && <BookOpen size={34} />}
              {index === 2 && <UserRound size={34} />}
              {index === 3 && <FileText size={34} />}
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section testimonials-section">
        <div className="section-inner">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">PLC Outcomes</p>
              <h2>What PLC learners and companies are saying</h2>
            </div>
            <Link className="button ghost small" to="/testimonials">
              View All Testimonials
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="home-testimonial-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name}>
                <span className="quote-mark">"</span>
                <p>{testimonial.review}</p>
                <div>
                  <img src={testimonial.photo} alt="" />
                  <span>
                    <strong>{testimonial.name}</strong>
                    <small>{testimonial.occupation}</small>
                  </span>
                  <span className="stars">*****</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section article-section">
        <div className="section-inner">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">From Our Blog</p>
              <h2>Latest PLC insights and consulting notes</h2>
            </div>
            <Link className="button ghost small" to="/blog">
              View All Articles
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="home-article-grid">
            {articles.concat(articles.slice(0, 1)).slice(0, 4).map((article, index) => (
              <article key={`${article.id}-${index}`}>
                <div className="article-thumb">
                  <img src={article.image} alt="" />
                  <span>{article.category}</span>
                </div>
                <div>
                  <h3>{article.title}</h3>
                  <p>
                    May {15 - index * 4}, 2026
                    <span>|</span>
                    {article.readingTime} read
                  </p>
                </div>
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
            <h2>Stay Updated with PlaneForge</h2>
            <p>Subscribe to get PLC course updates, automation notes, consulting insights, and exclusive offers.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </main>
  );
};
