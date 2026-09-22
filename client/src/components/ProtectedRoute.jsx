import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const accountRole = (role) => (['student', 'learner', 'buyer'].includes(role) ? 'user' : role);
const dashboardPath = (role) => `/dashboard/${accountRole(role) || 'user'}`;

export const ProtectedRoute = ({ roles, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    if (roles?.length === 1 && roles.includes('admin')) {
      return <Navigate to="/admin" replace state={{ from: location }} />;
    }

    if (roles?.includes('consultant') && !roles.includes('user')) {
      return <Navigate to="/consultant" replace state={{ from: location }} />;
    }

    if (roles?.includes('partner') && !roles.includes('user')) {
      return <Navigate to="/partner" replace state={{ from: location }} />;
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.map(accountRole).includes(accountRole(user.role))) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  return children;
};
