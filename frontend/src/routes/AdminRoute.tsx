import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAdminStore } from '@/store/useAdminStore';
import { useUserStore } from '@/store/useUserStore';
import apiClient from '@/api/client';
import { Spinner } from '@/components/shared/Spinner';

export function AdminRoute() {
  const { isAdminAuthenticated, logoutAdmin } = useAdminStore();
  const { isAuthenticated } = useUserStore();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidAdmin, setIsValidAdmin] = useState(false);

  useEffect(() => {
    const verifyAdminToken = async () => {
      if (!isAdminAuthenticated) {
        setIsVerifying(false);
        setIsValidAdmin(false);
        return;
      }

      try {
        // Verify admin token by calling an admin-only endpoint
        const response = await apiClient.get<{ user: { role: string } }>('/auth/profile');
        const user = response.data?.user;
        
        if (user?.role === 'admin') {
          setIsValidAdmin(true);
        } else {
          // Token is valid but user is not admin - logout
          logoutAdmin();
          setIsValidAdmin(false);
        }
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status === 401 || status === 403) {
          logoutAdmin();
          setIsValidAdmin(false);
        } else {
          // Keep session on transient/network errors
          setIsValidAdmin(true);
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAdminToken();
  }, [isAdminAuthenticated, logoutAdmin]);

  // Show loading spinner while verifying
  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--color-background)">
        <Spinner size="lg" />
      </div>
    );
  }

  // Logged-in normal users should not see admin entry points.
  if (isAuthenticated && !isValidAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!isValidAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
