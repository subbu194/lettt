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
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAdminToken = async () => {
      if (!isAdminAuthenticated) {
        setIsVerifying(false);
        setIsValidAdmin(false);
        return;
      }

      try {
        // Verify admin token by calling the admin-specific verify endpoint
        // This endpoint uses authenticateAdmin middleware which checks adminToken cookie
        await apiClient.get('/auth/admin/verify');
        setIsValidAdmin(true);
        setVerificationError(null);
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status === 401 || status === 403) {
          logoutAdmin();
          setIsValidAdmin(false);
          setVerificationError('Session expired. Please sign in again.');
        } else {
          // Do not grant access if verification fails
          setIsValidAdmin(false);
          setVerificationError('Unable to verify admin session. Please retry.');
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
    if (verificationError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-(--color-background)">
          <div className="rounded-2xl border border-black/4 bg-white p-6 text-center shadow-lg">
            <p className="text-sm font-semibold text-(--color-text)">{verificationError}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold border border-black/10 hover:bg-gray-50 transition"
                onClick={() => {
                  logoutAdmin();
                  window.location.href = '/admin/login';
                }}
              >
                Logout & Re-login
              </button>
              <button
                className="rounded-xl bg-(--color-red) px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
                onClick={() => window.location.reload()}
              >
                Retry Request
              </button>
            </div>
          </div>
        </div>
      );
    }
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
