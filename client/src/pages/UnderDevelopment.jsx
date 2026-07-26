import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Hammer, Mail, Phone } from 'lucide-react';

const labels = {
  '/courses': 'PLC Courses',
  '/consultations': 'CEO Consulting',
  '/about': 'About Us',
  '/blog': 'Blog',
  '/contact': 'Contact',
  '/login': 'Login',
  '/register': 'Register',
  '/search': 'Search'
};

export const UnderDevelopment = () => {
  const { pathname } = useLocation();
  const title = labels[pathname] || 'This page';

  return (
    <main className="under-development-page">
      <section className="under-development-card">
        <span className="under-dev-icon">
          <Hammer size={34} />
        </span>
        <p className="eyebrow">Coming soon</p>
        <h1>{title} is being forged.</h1>
        <p>
          This part of PlaneForge Academy is under development while we shape the full learning
          and consultation experience. The homepage is ready now, and this section is next in line.
        </p>
        <div className="under-dev-actions">
          <Link className="button primary" to="/">
            Return Home
            <ArrowRight size={18} />
          </Link>
          <a className="button ghost" href="mailto:planeforge1@gmail.com">
            <Mail size={18} />
            Email Us
          </a>
          <a className="button ghost" href="tel:+2015406178">
            <Phone size={18} />
            Call
          </a>
        </div>
      </section>
    </main>
  );
};
