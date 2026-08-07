import { NavLink } from 'react-router-dom';
import { Award, BarChart3, BookOpen, BriefcaseBusiness, CalendarDays, FileText, Inbox, Settings, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navByRole = {
  student: [
    { to: '/dashboard/student', label: 'Learning', icon: BookOpen },
    { to: '/dashboard/student#certificates', label: 'Certificates', icon: Award },
    { to: '/dashboard/student#orders', label: 'Purchases', icon: FileText },
    { to: '/profile', label: 'Profile', icon: UserRound }
  ],
  consultant: [
    { to: '/dashboard/consultant', label: 'Sessions', icon: CalendarDays },
    { to: '/profile', label: 'Profile', icon: UserRound }
  ],
  partner: [
    { to: '/dashboard/partner', label: 'Partnerships', icon: BriefcaseBusiness },
    { to: '/profile', label: 'Profile', icon: UserRound }
  ],
  admin: [
    { to: '/dashboard/admin', label: 'Overview', icon: BarChart3 },
    { to: '/dashboard/admin#inquiries', label: 'Inquiries', icon: Inbox },
    { to: '/dashboard/admin#content', label: 'Content', icon: BookOpen },
    { to: '/dashboard/admin#payments', label: 'Payments', icon: FileText },
    { to: '/dashboard/admin#settings', label: 'Settings', icon: Settings }
  ]
};

export const DashboardShell = ({ children, title, subtitle }) => {
  const { user } = useAuth();
  const links = navByRole[user?.role] || [];

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="profile-chip">
          {user?.avatar ? <img src={user.avatar} alt="" /> : <span>{user?.name?.slice(0, 1)}</span>}
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.role}</small>
          </div>
        </div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={label} to={to}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="dashboard-main">
        <div className="page-heading compact-heading">
          <p className="eyebrow">{user?.role} dashboard</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
};
