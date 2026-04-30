import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route that requires authentication.
 * Optional `roles` prop: array of allowed roles (e.g. ['admin']).
 */
export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role) && !user.is_superuser) {
    return <Navigate to="/" replace />;
  }
  return children;
}
