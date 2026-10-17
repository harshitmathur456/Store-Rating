import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  roles?: ('ADMIN' | 'USER' | 'OWNER')[];
}

export function ProtectedRoute({ children, roles }: RouteGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-accent" />
      </div>
    );
  }

  if (user) {
    const redirectMap = { ADMIN: '/admin', USER: '/stores', OWNER: '/owner' };
    return <Navigate to={redirectMap[user.role]} replace />;
  }

  return <>{children}</>;
}
