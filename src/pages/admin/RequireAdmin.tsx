import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAdminAuth } from '../../auth/AdminAuth';

/**
 * Blocks /admin/* for anyone without a live authority session.
 * Users of the driver app are redirected to the login screen —
 * they can never reach admin data or screens.
 */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { session } = useAdminAuth();
  const location = useLocation();
  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location.pathname + location.search }} replace />;
  }
  return <>{children}</>;
}
