import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle,
  FileText,
  GraduationCap,
  Mail,
  ShieldCheck,
  Star,
  Users,
  Wrench
} from 'lucide-react';
import { courses, heroImage, publicStats } from '../data/catalog.js';
import { NewsletterForm } from '../components/NewsletterForm.jsx';
import { safeLocalStorage } from '../utils/storage.js';

const formatMoney = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const featuredCourses = courses.filter((course) => course.isFeatured).slice(0, 8);
const statIcons = [Users, BookOpen, ShieldCheck, Award];

const consultationCards = [
  {
    title: 'PCB Project Builds',
    text: 'Architecture, component choices, schematic review, and release planning for real board builds.',
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

const industriesServed = [
  'Education',
  'Robotics',
  'Embedded Products',
  'IoT',
  'Power Electronics',
  'Research Labs'
];

const seoFaqs = [
  {
    question: 'What does PlaneForge Academy teach?',
    answer:
      'PlaneForge Academy teaches practical PCB design through project-based courses, board builds, certificates, and hardware consulting.'
  },
  {
    question: 'Are PlaneForge courses project-based?',
    answer:
      'Yes. Courses are built around real PCB projects with schematic, layout, manufacturing, review, and bring-up workflows.'
  },
  {
    question: 'Can companies consult PlaneForge?',
    answer:
      'Yes. Companies can request PCB project planning, feasibility review, schematic and layout review, DFM, troubleshooting, and implementation support.'
  }
];

const setMetaTag = ({ key, value, attr = 'name' }) => {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
};

const useHomepageSeo = () => {
  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = `${origin}/`;
    const imageUrl = `${origin}/icon.svg`;
    document.title = 'PlaneForge Academy | Project-Based PCB Design Courses';

    setMetaTag({
      key: 'description',
      value:
        'Learn PCB design through project-based courses, real board builds, certificates, and PlaneForge hardware consulting.'
    });
    setMetaTag({ key: 'og:title', value: 'PlaneForge Academy', attr: 'property' });
    setMetaTag({
      key: 'og:description',
      value: 'Project-based PCB design courses, board builds, certificates, and hardware consulting.',
      attr: 'property'
    });
    setMetaTag({ key: 'og:type', value: 'website', attr: 'property' });
    setMetaTag({ key: 'og:url', value: canonicalUrl, attr: 'property' });
    setMetaTag({ key: 'og:image', value: imageUrl, attr: 'property' });
    setMetaTag({ key: 'twitter:card', value: 'summary_large_image' });
    setMetaTag({ key: 'twitter:title', value: 'PlaneForge Academy' });
    setMetaTag({
      key: 'twitter:description',
      value: 'Learn PCB design with real board projects and practical engineering workflows.'
    });
    setMetaTag({ key: 'twitter:image', value: imageUrl });

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const schemas = [
      {
        id: 'schema-organization',
        data: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'PlaneForge Academy',
          url: canonicalUrl,
          logo: imageUrl,
          contactPoint: [
            {
              '@type': 'ContactPoint',
              email: 'planeforge1@gmail.com',
              contactType: 'customer support'
            }
          ]
        }
      },
      {
        id: 'schema-faq',
        data: {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: seoFaqs.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer
            }
          }))
        }
      },
      {
        id: 'schema-breadcrumb',
        data: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: canonicalUrl
            }
          ]
        }
      }
    ];

    schemas.forEach(({ id, data }) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
    });
  }, []);
};

const useRevealSections = () => {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll('.reveal-section'));
    if (!targets.length) return undefined;

    if (!('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -60px' }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
};

const useScrollButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 720);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return visible;
};

const CourseBadge = ({ course, index }) => {
  if (index < 2) return <span className="course-badge new">New</span>;
  if (course.studentsEnrolled > 1780) return <span className="course-badge seller">Best Seller</span>;
  return null;
};

const CookieConsent = () => {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return safeLocalStorage.getItem('planeforge_cookie_consent') !== 'accepted';
  });

  if (!visible) return null;

  const accept = () => {
    safeLocalStorage.setItem('planeforge_cookie_consent', 'accepted');
    setVisible(false);
  };

  return (
    <div className="cookie-banner" role="region" aria-label="Cookie consent">
      <p>
        PlaneForge uses essential storage for login, course access, and preferences. Analytics can
        be added only after consent.
      </p>
      <button className="button primary small" type="button" onClick={accept}>
        Accept
      </button>
      <Link className="button ghost small" to="/privacy">
        Privacy
      </Link>
    </div>
  );
};

export const Home = () => {
  const showScrollButton = useScrollButton();
  useHomepageSeo();
  useRevealSections();

  return (
    <main className="home-page">
      <section className="pf-hero" style={{ '--hero-background-image': `url(${heroImage})` }}>
        <div className="section-inner hero-grid">
          <div className="hero-copy">
            <h1 className="hero-headline">
              <span className="hero-headline-main">PCB Design Training</span>
              <span className="hero-headline-promise">Real Boards.</span>
              <span className="hero-headline-promise">Real Skills.</span>
            </h1>
            <div className="hero-actions">
              <Link className="button primary" to="/courses">
                Explore PCB Courses
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
        <a className="scroll-indicator" href="#courses" aria-label="Continue to courses">
          <span />
          Continue
        </a>
      </section>

      <section className="stats-strip reveal-section" aria-label="PlaneForge public stats">
        <div className="section-inner stats-grid">
          {publicStats.map((item, index) => {
            const Icon = statIcons[index] || Award;
            return (
              <article key={item.label}>
                <Icon size={28} />
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-section courses-showcase reveal-section" id="courses">
        <div className="section-inner">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">PCB Courses</p>
              <h2 className="sr-only">Featured PCB courses</h2>
            </div>
            <Link className="button ghost small" to="/courses">
              View All PCB Courses
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="home-course-grid">
            {featuredCourses.map((course, index) => (
              <article className="home-course-card" key={course.slug}>
                <div className="course-thumb">
                  <img
                    src={course.thumbnail}
                    alt={`${course.title} course thumbnail`}
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{course.category}</span>
                  <CourseBadge course={course} index={index} />
                </div>
                <div className="home-course-body">
                  <div className="course-topline">
                    <em>{course.difficulty}</em>
                    <small>{course.duration}</small>
                  </div>
                  <h3>{course.title}</h3>
                  <p className="instructor-line">
                    <GraduationCap size={16} />
                    {course.instructorName}
                  </p>
                  <div className="course-card-meta">
                    <span>
                      <Star size={15} fill="currentColor" /> {course.rating}
                    </span>
                    <span>
                      <Users size={15} /> {course.studentsEnrolled.toLocaleString()} learners
                    </span>
                  </div>
                  <div className="course-price-row">
                    <span>{course.discipline}</span>
                    <strong>{formatMoney(course.price, course.currency)}</strong>
                  </div>
                  <Link className="button ghost small card-course-button" to={`/courses/${course.slug}`}>
                    View Course
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="section-action-strip">
            <span>Ready to choose a board project?</span>
            <Link className="button primary" to="/courses">
              Browse Full Catalog
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="consultation-band reveal-section">
        <div className="section-inner consultation-grid">
          <div>
            <p className="eyebrow">Engineering Consultation</p>
            <h2>PCB consulting for teams and projects</h2>
            <p>
              Get support for project planning, hardware research, schematic and layout review,
              product builds, troubleshooting, and implementation decisions.
            </p>
            <div className="consultation-response">
              <CheckCircle size={17} />
              Estimated response time: within 24 hours
            </div>
            <div className="hero-actions consultation-actions">
              <Link className="button primary" to="/consultations">
                Consult PlaneForge
                <ArrowRight size={18} />
              </Link>
              <Link className="button outline-light" to="/contact">
                Request a Quote
                <Mail size={18} />
              </Link>
            </div>
          </div>
          <div className="consultation-card-grid expanded">
            {consultationCards.map(({ title, text, icon: Icon }) => (
              <article key={title}>
                <Icon size={32} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
            <article className="consult-industries">
              <BriefcaseBusiness size={32} />
              <h3>Industries Served</h3>
              <div>
                {industriesServed.map((industry) => (
                  <span key={industry}>{industry}</span>
                ))}
              </div>
            </article>
            <article className="consult-industries">
              <Wrench size={32} />
              <h3>Consultation Types</h3>
              <div>
                {['Review', 'Build Planning', 'Troubleshooting', 'Training'].map((type) => (
                  <span key={type}>{type}</span>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="newsletter-cta reveal-section">
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

      {showScrollButton && (
        <button
          className="scroll-top-button"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
      <CookieConsent />
    </main>
  );
};
