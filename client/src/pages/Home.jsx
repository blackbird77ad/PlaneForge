import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle,
  CircuitBoard,
  Clock,
  FileText,
  GraduationCap,
  Mail,
  MonitorPlay,
  PlayCircle,
  Search,
  ShieldCheck,
  Star,
  Users,
  Wrench
} from 'lucide-react';
import { articles, boardImages, courses, heroImage, publicStats, testimonials } from '../data/catalog.js';
import { NewsletterForm } from '../components/NewsletterForm.jsx';
import introVideo from '../assets/video5129607874019855717 (1).mp4';

const formatMoney = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const setSmoothVideoSpeed = (event) => {
  event.currentTarget.playbackRate = 0.75;
};

const featuredCourses = courses.filter((course) => course.isFeatured).slice(0, 8);
const featuredArticles = articles.slice(0, 3);
const featuredTestimonials = testimonials.slice(0, 3);
const statIcons = [Users, BookOpen, ShieldCheck, Award];
const projectBasedCount = courses.filter((course) => course.certificateAvailable).length;

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

const courseCategories = [
  {
    label: 'PCB Design',
    to: '/courses?discipline=PCB%20Design',
    description: 'First boards, design rules, symbols, footprints, and DFM fundamentals.',
    tone: 'blue'
  },
  {
    label: 'Embedded Systems',
    to: '/courses?discipline=Embedded%20Hardware',
    description: 'ESP32, STM32, RP2040, USB-C, battery, and programming boards.',
    tone: 'orange'
  },
  {
    label: 'FPGA',
    to: '/courses?discipline=FPGA%20Hardware',
    description: 'Digital boards, JTAG tools, power sequencing, and test fixtures.',
    tone: 'green'
  },
  {
    label: 'RF Design',
    to: '/courses?discipline=High-Speed%20PCB',
    description: 'Differential routing, antenna breakouts, impedance, and EMC review.',
    tone: 'purple'
  },
  {
    label: 'Power Electronics',
    to: '/courses?discipline=Power%20Electronics',
    description: 'Converters, chargers, motor drivers, power distribution, and thermal design.',
    tone: 'amber'
  },
  {
    label: 'Sensors',
    to: '/courses?discipline=Mixed-Signal%20PCB',
    description: 'Breakouts, analog front ends, ADC boards, and environmental sensing.',
    tone: 'teal'
  },
  {
    label: 'Automotive',
    to: '/courses?search=CAN%20Bus',
    description: 'CAN bus interfaces, rugged connectors, power protection, and review habits.',
    tone: 'slate'
  },
  {
    label: 'IoT Hardware',
    to: '/courses?discipline=Robotics%20Hardware',
    description: 'Connected boards for robotics, wearables, telemetry, and field systems.',
    tone: 'red'
  }
];

const learningSteps = [
  {
    title: 'Discover Course',
    text: 'Choose a PCB project by difficulty, discipline, or hardware outcome.',
    icon: Search
  },
  {
    title: 'Purchase Securely',
    text: 'Enroll through the protected checkout flow and unlock your project path.',
    icon: ShieldCheck
  },
  {
    title: 'Start Learning',
    text: 'Move through schematic, layout, manufacturing files, and bring-up decisions.',
    icon: PlayCircle
  },
  {
    title: 'Complete Projects',
    text: 'Build a portfolio around real board files, checklists, and design reviews.',
    icon: CircuitBoard
  },
  {
    title: 'Earn Certificate',
    text: 'Finish with a certificate connected to demonstrated board-building work.',
    icon: Award
  }
];

const featuredProjects = [
  {
    title: 'ESP32 Development Board',
    slug: 'build-an-esp32-dev-board-from-scratch',
    difficulty: 'Intermediate',
    software: 'KiCad',
    buildTime: '5h 30m',
    description: 'USB, power regulation, boot controls, headers, and bring-up checkpoints.'
  },
  {
    title: 'STM32 Development Board',
    slug: 'build-an-stm32-sensor-dev-board',
    difficulty: 'Intermediate',
    software: 'KiCad',
    buildTime: '5h 45m',
    image: boardImages.stm32,
    description: 'A compact embedded board with USB, sensor expansion, power, and test points.'
  },
  {
    title: 'Flight Controller',
    slug: 'build-your-own-flight-controller-board-from-scratch',
    difficulty: 'Advanced',
    software: 'KiCad',
    buildTime: '6h 05m',
    description: 'IMU, power, connectors, embedded layout choices, and validation planning.'
  },
  {
    title: 'FPGA Development Board',
    slug: 'build-your-own-fpga-development-board-from-scratch',
    difficulty: 'Advanced',
    software: 'Altium / KiCad',
    buildTime: '6h 30m',
    image: boardImages.cpld,
    description: 'Digital hardware architecture, power rails, dense routing, and JTAG access.'
  },
  {
    title: 'Sensor Breakout Board',
    slug: 'build-a-combo-accelerometer-barometer-breakout-board',
    difficulty: 'Intermediate',
    software: 'KiCad',
    buildTime: '4h 35m',
    description: 'A compact mixed-signal sensor board with clean interfaces and review notes.'
  },
  {
    title: 'Power Supply PCB',
    slug: 'buck-converter-pcb-layout',
    difficulty: 'Intermediate',
    software: 'KiCad',
    buildTime: '4h 45m',
    description: 'Switching converter layout with current loops, thermals, and DFM checks.'
  },
  {
    title: 'Motor Driver PCB',
    slug: 'motor-driver-carrier-pcb',
    difficulty: 'Advanced',
    software: 'Altium / KiCad',
    buildTime: '5h 55m',
    description: 'Motor current paths, protection, connectors, measurement, and test planning.'
  },
  {
    title: 'USB-C Interface Board',
    slug: 'usb-c-power-and-programming-board',
    difficulty: 'Intermediate',
    software: 'KiCad',
    buildTime: '4h 40m',
    description: 'USB-C power, programming headers, protection, routing, and usability details.'
  }
];

const consultationTopics = [
  {
    title: 'PCB Project Builds',
    text: 'Architecture, component choices, schematic review, layout review, and release files.',
    to: '/consultations#project-builds'
  },
  {
    title: 'Research & Feasibility',
    text: 'Technical risk review, part comparison, prototype planning, and project assumptions.',
    to: '/consultations#research'
  },
  {
    title: 'Implementation Support',
    text: 'DFM review, bring-up support, troubleshooting, test planning, and board revision work.',
    to: '/consultations#implementation'
  },
  {
    title: 'Team PCB Training',
    text: 'Structured onboarding for schools, companies, labs, and hardware teams.',
    to: '/contact'
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

const successMetrics = [
  {
    value: 100,
    label: 'Learners Supported',
    detail: 'Launch-ready cohort capacity'
  },
  {
    value: courses.length,
    label: 'Courses Published',
    detail: 'Project-based PCB catalog'
  },
  {
    value: courses.length,
    label: 'PCBs Mapped',
    detail: 'Board projects connected to courses'
  },
  {
    value: projectBasedCount,
    label: 'Certificates Enabled',
    detail: 'Courses with project certificates'
  },
  {
    value: 8,
    label: 'Learning Tracks',
    detail: 'From first PCB to capstone work'
  }
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

const searchCorpus = [
  ...courses.map((course) => ({
    type: 'Course',
    title: course.title,
    text: `${course.category} ${course.discipline} ${course.difficulty} ${course.skills?.join(' ')}`,
    to: `/courses/${course.slug}`,
    meta: `${course.difficulty} - ${course.duration}`
  })),
  ...articles.map((article) => ({
    type: 'Article',
    title: article.title,
    text: `${article.category} ${article.excerpt} ${article.body}`,
    to: `/blog#${article.slug}`,
    meta: article.readingTime
  })),
  ...consultationTopics.map((topic) => ({
    type: 'Consultation',
    title: topic.title,
    text: topic.text,
    to: topic.to,
    meta: 'Response within 24 hours'
  }))
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

const AnimatedMetric = ({ metric }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!ref.current) return undefined;

    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    const duration = 900;
    const startTime = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(metric.value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [metric.value, visible]);

  return (
    <article ref={ref} className="success-metric-card">
      <strong>
        {current.toLocaleString()}
        {metric.suffix || ''}
      </strong>
      <span>{metric.label}</span>
      <p>{metric.detail}</p>
    </article>
  );
};

const AnimatedCircuitBackdrop = () => (
  <svg className="hero-animated-circuit" viewBox="0 0 1200 680" aria-hidden="true">
    <defs>
      <linearGradient id="heroTraceGradient" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#ff7a1a" />
        <stop offset="48%" stopColor="#65d6ff" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>
    </defs>
    <path d="M40 118 H252 V206 H412 V134 H594" />
    <path d="M62 404 H210 V322 H376 V430 H566 V350 H760" />
    <path d="M688 92 V218 H870 V310 H1110" />
    <path d="M794 520 H956 V434 H1132" />
    <path d="M174 580 V496 H346" />
    {[94, 252, 412, 594, 760, 870, 956, 1110].map((x, index) => (
      <circle key={`${x}-${index}`} cx={x} cy={index % 2 ? 206 + index * 24 : 118 + index * 18} r="6" />
    ))}
  </svg>
);

const EngineeringIcon = ({ tone }) => (
  <svg className={`engineering-icon ${tone}`} viewBox="0 0 64 64" aria-hidden="true">
    <rect x="12" y="14" width="40" height="36" rx="6" />
    <path d="M20 26h10m4 0h10M20 36h6m10 0h8M28 14v-6m8 6v-6M28 56v-6m8 6v-6M8 28h4m-4 8h4m44-8h4m-4 8h4" />
    <circle cx="26" cy="36" r="3" />
    <circle cx="42" cy="26" r="3" />
  </svg>
);

const ProjectBoardPreview = ({ title, index }) => {
  const traces = [
    'M18 30 H70 V52 H116',
    'M24 76 H54 V108 H130 V84 H170',
    'M92 22 V58 H146',
    'M40 132 H86 V154 H154',
    'M144 34 H178 V68'
  ];

  return (
    <svg className="project-board-render" viewBox="0 0 200 170" role="img" aria-label={`${title} PCB render`}>
      <rect className="board-base" x="8" y="10" width="184" height="150" rx="10" />
      <rect className="board-core" x="52" y="50" width="62" height="48" rx="6" />
      <rect className="board-port" x="144" y="18" width="28" height="18" rx="3" />
      <rect className="board-port" x="22" y="126" width="34" height="16" rx="3" />
      {traces.map((trace, traceIndex) => (
        <path
          className="board-trace"
          d={trace}
          key={trace}
          style={{ animationDelay: `${(index + traceIndex) * 120}ms` }}
        />
      ))}
      {Array.from({ length: 20 }).map((_, pinIndex) => (
        <circle
          className="board-pad"
          cx={22 + ((pinIndex * 17 + index * 5) % 154)}
          cy={24 + ((pinIndex * 29 + index * 11) % 118)}
          r={pinIndex % 5 === 0 ? 3.6 : 2.4}
          key={pinIndex}
        />
      ))}
      <text x="18" y="150">
        PF-{String(index + 1).padStart(2, '0')}
      </text>
    </svg>
  );
};

const CourseBadge = ({ course, index }) => {
  if (index < 2) return <span className="course-badge new">New</span>;
  if (course.studentsEnrolled > 1780) return <span className="course-badge seller">Best Seller</span>;
  return null;
};

const CookieConsent = () => {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('planeforge_cookie_consent') !== 'accepted';
  });

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem('planeforge_cookie_consent', 'accepted');
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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const showScrollButton = useScrollButton();
  useHomepageSeo();
  useRevealSections();

  const suggestions = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return searchCorpus.slice(0, 6);

    return searchCorpus
      .filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [searchTerm]);

  const groupedSuggestions = useMemo(
    () =>
      suggestions.reduce((groups, item) => {
        groups[item.type] = [...(groups[item.type] || []), item];
        return groups;
      }, {}),
    [suggestions]
  );

  const submitSearch = (event) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="home-page">
      <section className="pf-hero">
        <AnimatedCircuitBackdrop />
        <div className="section-inner hero-grid">
          <div className="hero-copy">
            <p className="hero-badge">PlaneForge Academy</p>
            <span className="hero-trusted-badge">
              <Users size={15} />
              Trusted by Students & Hardware Teams
            </span>
            <h1 className="hero-headline">
              <span className="hero-headline-main">PCB Design Training</span>
              <span className="hero-headline-promise">Real Boards.</span>
              <span className="hero-headline-promise">Real Skills.</span>
            </h1>
            <p className="hero-description">
              Master printed circuit board design through hands-on courses built around real
              boards, real files, and practical hardware decisions. Start with beginner projects,
              then grow into dev boards, sensors, power electronics, FPGA hardware, robotics, and
              capstone builds.
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
            <div className="watch-introduction-row">
              <a className="button intro-button" href="#intro-video">
                <MonitorPlay size={20} />
                Watch Introduction
              </a>
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
            <div className="hero-workspace-shell">
              <video
                className="hero-workspace-video"
                autoPlay
                loop
                muted
                onLoadedMetadata={setSmoothVideoSpeed}
                playsInline
                poster={heroImage}
                preload="metadata"
                src={introVideo}
                aria-label="PlaneForge PCB training preview video"
              />
              <div className="workspace-signal signal-one" aria-hidden="true" />
              <div className="workspace-signal signal-two" aria-hidden="true" />
            </div>
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
        <a className="scroll-indicator" href="#home-search" aria-label="Continue to homepage search">
          <span />
          Continue
        </a>
      </section>

      <section className="home-search-band reveal-section" id="home-search" aria-label="Search PlaneForge">
        <div className="section-inner">
          <form className="home-search-panel" onSubmit={submitSearch}>
            <div>
              <p className="eyebrow">Global Search</p>
              <h2>Find courses, articles, and PCB consultation topics</h2>
            </div>
            <label className="home-live-search">
              <Search size={22} />
              <span className="sr-only">Search PlaneForge</span>
              <input
                value={searchTerm}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                onChange={(event) => setSearchTerm(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search ESP32, FPGA, DFM, power, consultation..."
                type="search"
              />
              <button className="button primary small" type="submit" disabled={!searchTerm.trim()}>
                Search
              </button>
            </label>
          </form>
          {(searchFocused || searchTerm) && (
            <div className="search-suggestions" aria-live="polite">
              {suggestions.length ? (
                Object.entries(groupedSuggestions).map(([group, items]) => (
                  <section key={group}>
                    <h3>{group}</h3>
                    {items.map((item) => (
                      <Link to={item.to} key={`${item.type}-${item.title}`}>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.meta}</small>
                        </span>
                        <ArrowRight size={16} />
                      </Link>
                    ))}
                  </section>
                ))
              ) : (
                <div className="search-empty-state">
                  <Search size={22} />
                  <span>No homepage matches yet. Try a broader PCB topic.</span>
                  <Link to="/contact">Ask PlaneForge</Link>
                </div>
              )}
            </div>
          )}
        </div>
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

      <section className="home-section courses-showcase reveal-section">
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

      <section className="home-section category-browser reveal-section">
        <div className="section-inner">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Course Categories</p>
              <h2>Jump straight into the hardware discipline you want to build.</h2>
            </div>
            <Link className="button ghost small" to="/courses">
              Open Filters
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="category-browser-grid">
            {courseCategories.map((category) => (
              <Link className="category-browser-card" to={category.to} key={category.label}>
                <EngineeringIcon tone={category.tone} />
                <h3>{category.label}</h3>
                <p>{category.description}</p>
                <span>
                  Filter Catalog
                  <ArrowRight size={15} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section mission-section reveal-section">
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
                <span className="mission-icon-wrap">
                  <Icon size={27} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                <Link to="/about">
                  Learn More
                  <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section process-section reveal-section">
        <div className="section-inner">
          <div className="section-heading centered-heading">
            <p className="eyebrow">How Learning Works</p>
            <h2>From discovery to certificate, every step stays tied to a real PCB build.</h2>
          </div>
          <div className="learning-process">
            {learningSteps.map(({ title, text, icon: Icon }, index) => (
              <article key={title}>
                <span className="process-index">{index + 1}</span>
                <Icon size={28} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="section-action-strip compact">
            <span>Start with the first project that matches your skill level.</span>
            <Link className="button primary" to="/courses">
              Find My Course
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section projects-section reveal-section" id="built-at-planeforge">
        <div className="section-inner">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Built at PlaneForge</p>
              <h2>Real hardware projects that make the academy different.</h2>
            </div>
            <Link className="button ghost small" to="/courses">
              View Project Courses
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="project-grid">
            {featuredProjects.map((project, index) => (
              <article className="project-card" key={project.title}>
                {project.image ? (
                  <img
                    className="project-board-photo"
                    src={project.image}
                    alt={`${project.title} hardware board`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <ProjectBoardPreview title={project.title} index={index} />
                )}
                <div>
                  <div className="project-meta-row">
                    <span>{project.difficulty}</span>
                    <span>{project.software}</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <small>
                    <Clock size={14} />
                    Estimated build time: {project.buildTime}
                  </small>
                  <Link className="button ghost small" to={`/courses/${project.slug}`}>
                    Learn This Project
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="consultation-band reveal-section">
        <div className="section-inner consultation-grid">
          <div>
            <p className="eyebrow">Engineering Consultation</p>
            <h2>Companies consult with PlaneForge for PCB projects, products, and builds</h2>
            <p>
              PlaneForge is well versed in PCB project planning, hardware research, schematic and
              layout architecture, product builds, troubleshooting, and implementation decisions.
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

      <section className="home-section success-section reveal-section">
        <div className="section-inner">
          <div className="section-heading centered-heading">
            <p className="eyebrow">Student Success Metrics</p>
            <h2>Built for serious PCB learners and growing hardware teams.</h2>
          </div>
          <div className="success-metric-grid">
            {successMetrics.map((metric) => (
              <AnimatedMetric metric={metric} key={metric.label} />
            ))}
          </div>
        </div>
      </section>

      <section className="home-section testimonials-section reveal-section">
        <div className="section-inner">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Learner Outcomes</p>
              <h2>Structured for learners who need confidence before the board order</h2>
            </div>
            <Link className="button ghost small" to="/testimonials">
              Read Stories
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="home-testimonial-grid">
            {featuredTestimonials.map((item) => (
              <article key={item.name}>
                <span className="quote-mark">"</span>
                <p>{item.quote}</p>
                <div>
                  <img src={item.avatar} alt={`${item.name} avatar`} loading="lazy" decoding="async" />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.role}</small>
                  </span>
                  <em>{item.result}</em>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section latest-articles-section reveal-section">
        <div className="section-inner">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Engineering Notes</p>
              <h2>Practical PCB guidance for learners and hardware teams</h2>
            </div>
            <Link className="button ghost small" to="/blog">
              Visit Blog
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="home-article-grid">
            {featuredArticles.map((article) => (
              <article key={article.slug}>
                <div className="article-thumb">
                  <img
                    src={article.image}
                    alt={`${article.title} article preview`}
                    loading="lazy"
                    decoding="async"
                  />
                  <span>{article.category}</span>
                </div>
                <div>
                  <h3>{article.title}</h3>
                  <p>
                    <Clock size={15} />
                    {article.readingTime}
                  </p>
                  <p>{article.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="intro-video-section reveal-section" id="intro-video">
        <div className="section-inner intro-video-grid">
          <div>
            <p className="eyebrow">2 Minute Overview</p>
            <h2>See how PlaneForge turns PCB lessons into real board outcomes.</h2>
            <p>
              Preview the learner journey from course discovery to project files, design reviews,
              board bring-up habits, and certificate-ready outcomes.
            </p>
            <Link className="button primary" to="/about">
              Learn About PlaneForge
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="video-preview-card">
            <video
              className="intro-video-player"
              controls
              onLoadedMetadata={setSmoothVideoSpeed}
              playsInline
              poster={heroImage}
              preload="metadata"
              src={introVideo}
            />
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
