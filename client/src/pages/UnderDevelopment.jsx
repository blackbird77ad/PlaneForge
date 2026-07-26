import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Hammer, Mail, Phone } from 'lucide-react';

const labels = {
  '/courses': 'PCB Courses',
  '/consultations': 'PlaneForge Consulting',
  '/about': 'About Us',
  '/blog': 'Blog',
  '/contact': 'Contact',
  '/login': 'Login',
  '/register': 'Register',
  '/search': 'Search'
};

const pageTitle = (pathname) => {
  if (pathname.startsWith('/courses')) return 'PCB Courses';
  if (pathname.startsWith('/checkout')) return 'Checkout';
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  return labels[pathname] || 'This page';
};

export const UnderDevelopment = () => {
  const { pathname } = useLocation();
  const title = pageTitle(pathname);

  return (
    <main className="under-development-page">
      <section className="under-development-card">
        <span className="under-dev-icon">
          <Hammer size={34} />
        </span>
        <p className="eyebrow">Coming soon</p>
        <h1>{title} is warming up behind the scenes.</h1>
        <p>
          The homepage is live for now while we carefully shape the full PlaneForge Academy
          experience. This section is still being prepared, polished, and tested before it opens.
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
          <a className="button ghost" href="tel:+2015406176">
            <Phone size={18} />
            Call
          </a>
        </div>
      </section>
    </main>
  );
};
