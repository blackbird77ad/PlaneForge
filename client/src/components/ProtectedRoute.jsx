import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const dashboardPath = (role) => `/dashboard/${role || 'student'}`;

export const ProtectedRoute = ({ roles, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    if (roles?.length === 1 && roles.includes('admin')) {
      return <Navigate to="/admin" replace state={{ from: location }} />;
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  return children;
};
