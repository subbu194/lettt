import { useEffect, useState, useCallback } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAdminStore } from '@/store/useAdminStore';
import apiClient from '@/api/client';
import { Spinner } from '@/components/shared/Spinner';

export function AdminRoute() {
  const { isAdminAuthenticated, logoutAdmin } = useAdminStore();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogoutAndRelogin = useCallback(async () => {
    await logoutAdmin();
    window.location.href = '/admin/login';
  }, [logoutAdmin]);

  useEffect(() => {
    let cancelled = false;

    const verifyAdminToken = async () => {
      // If not authenticated at all, redirect to login
      if (!isAdminAuthenticated) {
        setStatus('invalid');
        return;
      }

      try {
        // Verify admin token by calling the admin-specific verify endpoint
        // If the access token is expired, the interceptor will auto-refresh
        // using the refresh cookie, then retry this request
        await apiClient.get('/auth/admin/verify');
        if (!cancelled) {
          setStatus('valid');
        }
      } catch (err) {
        if (cancelled) return;
        const axiosStatus = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (axiosStatus === 401 || axiosStatus === 403) {
          // Auth failed - clear state and redirect to login
          logoutAdmin();
          setStatus('invalid');
        } else {
          // Network error or server down — allow retry
          setErrorMessage('Unable to connect to server. Please check your connection and retry.');
          setStatus('error');
        }
      }
    };

    verifyAdminToken();
    return () => { cancelled = true; };
  }, [isAdminAuthenticated, logoutAdmin]);

  // Show loading spinner while verifying
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--color-background)">
        <Spinner size="lg" />
      </div>
    );
  }

  // Auth failed - redirect to login
  if (status === 'invalid') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  // Network/server error - show retry option
  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--color-background)">
        <div className="rounded-2xl border border-black/4 bg-white p-6 text-center shadow-lg max-w-sm">
          <p className="text-sm font-semibold text-(--color-text)">{errorMessage}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              className="rounded-xl px-4 py-2 text-sm font-semibold border border-black/10 hover:bg-gray-50 transition"
              onClick={handleLogoutAndRelogin}
            >
              Go to Login
            </button>
            <button
              className="rounded-xl bg-(--color-red) px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

