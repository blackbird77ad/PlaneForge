import { NavLink } from 'react-router-dom';
import { Award, BarChart3, BookOpen, BriefcaseBusiness, CalendarDays, CreditCard, FileText, Inbox, Package, UserRound, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navByRole = {
  user: [
    { to: '/dashboard/user', label: 'Learning', icon: BookOpen },
    { to: '/dashboard/user#certificates', label: 'Certificates', icon: Award },
    { to: '/dashboard/user#orders', label: 'Purchases', icon: FileText },
    { to: '/profile', label: 'Profile', icon: UserRound }
  ],
  student: [
    { to: '/dashboard/user', label: 'Learning', icon: BookOpen },
    { to: '/dashboard/user#certificates', label: 'Certificates', icon: Award },
    { to: '/dashboard/user#orders', label: 'Purchases', icon: FileText },
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
    { to: '/dashboard/admin', label: 'Dashboard', icon: BarChart3 },
    { to: '/dashboard/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/dashboard/admin/products', label: 'Products', icon: Package },
    { to: '/dashboard/admin/orders', label: 'Orders', icon: FileText },
    { to: '/dashboard/admin/users', label: 'Users', icon: Users },
    { to: '/dashboard/admin/payments', label: 'Payments', icon: CreditCard },
    { to: '/dashboard/admin/articles', label: 'Blog', icon: FileText },
    { to: '/dashboard/admin/careers', label: 'Careers', icon: BriefcaseBusiness },
    { to: '/dashboard/admin/consultations', label: 'Consultations', icon: CalendarDays },
    { to: '/dashboard/admin/inquiries', label: 'Inquiries', icon: Inbox },
    { to: '/dashboard/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/profile', label: 'Profile', icon: UserRound }
  ]
};

const roleLabel = (role) => (['student', 'learner', 'buyer', 'user'].includes(role) ? 'user' : role || 'account');

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
            <small>{roleLabel(user?.role)}</small>
          </div>
        </div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={label} to={to} end={to === '/dashboard/admin'}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="dashboard-main">
        <div className="page-heading compact-heading">
          <p className="eyebrow">{roleLabel(user?.role)} dashboard</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
};
