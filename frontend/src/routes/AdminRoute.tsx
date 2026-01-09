import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminStore } from '@/store/useAdminStore';
import { useUserStore } from '@/store/useUserStore';

export function AdminRoute() {
  const { isAdminAuthenticated } = useAdminStore();
  const { isAuthenticated } = useUserStore();
  const location = useLocation();

  // Logged-in normal users should not see admin entry points.
  if (isAuthenticated && !isAdminAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
