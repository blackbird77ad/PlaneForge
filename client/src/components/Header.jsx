import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/planeforge-logo.png';

const navItems = [
  { to: '/', label: 'Home' },
  {
    to: '/courses',
    label: 'PLC Courses',
    dropdown: ['All PLC Courses', 'PLC Fundamentals', 'Troubleshooting', 'HMI & SCADA']
  },
  {
    to: '/consultations',
    label: 'CEO Consulting',
    dropdown: ['Company Projects', 'Research Support', 'PLC Reviews']
  },
  { to: '/about', label: 'About Us' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' }
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <header className={scrolled ? 'site-header scrolled' : 'site-header'}>
      <div className="site-header-inner">
        <Link className="brand-logo" to="/" onClick={close} aria-label="PlaneForge Academy home">
          <span className="brand-mark-crop" aria-hidden="true">
            <img src={logo} alt="" />
          </span>
          <span className="brand-wordmark">
            <span>
              Plane<span>Forge</span>
            </span>
            <small>ACADEMY</small>
          </span>
        </Link>

        <button
          className="icon-button mobile-toggle"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="primary-navigation"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav id="primary-navigation" className={open ? 'primary-nav open' : 'primary-nav'}>
          {navItems.map((item) => (
            <div className="nav-item" key={item.to}>
              <NavLink to={item.to} onClick={close}>
                {item.label}
                {item.dropdown && <ChevronDown size={15} />}
              </NavLink>
              {item.dropdown && (
                <div className="nav-dropdown">
                  {item.dropdown.map((label) => (
                    <Link key={label} to={item.to} onClick={close}>
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="header-actions">
          <Link className="header-search" to="/search" aria-label="Search PlaneForge">
            <Search size={24} strokeWidth={2.25} />
          </Link>
          <Link className="button ghost small" to={user ? `/dashboard/${user.role}` : '/login'}>
            Login
          </Link>
          <Link className="button primary small" to="/register">
            Register
          </Link>
        </div>
      </div>
    </header>
  );
};
