import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import logo from '../assets/planeforge-logo-site.png';

const navItems = [
  { to: '/', label: 'Home' },
  {
    to: '/courses',
    label: 'PCB Courses',
    dropdown: [
      { to: '/courses', label: 'All PCB Courses' },
      { to: '/courses?category=Starter%20PCB%20Builds', label: 'Beginner Builds' },
      { to: '/courses?category=Embedded%20Dev%20Boards', label: 'Dev Boards & Programmers' },
      { to: '/courses?category=FPGA%20and%20Digital%20Boards', label: 'FPGA Design' }
    ]
  },
  {
    to: '/consultations',
    label: 'PlaneForge Consulting',
    dropdown: [
      { to: '/consultations#project-builds', label: 'PCB Project Builds' },
      { to: '/consultations#research', label: 'Research & Feasibility' },
      { to: '/consultations#implementation', label: 'Implementation Support' }
    ]
  },
  { to: '/about', label: 'About Us' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' }
];

export const Header = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { logout, user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setOpen(false);

  const signOut = async () => {
    await logout();
    close();
    navigate('/login');
  };

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
                  {item.dropdown.map((link) => (
                    <Link key={link.label} to={link.to} onClick={close}>
                      {link.label}
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
          {user ? (
            <>
              <Link className="button ghost small" to="/profile" onClick={close}>
                Account
              </Link>
              <button className="button primary small" type="button" onClick={signOut}>
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="button ghost small" to="/login">
                Login
              </Link>
              <Link className="button primary small" to="/signup">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
