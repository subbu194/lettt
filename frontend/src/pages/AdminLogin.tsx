import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useAdminStore } from '@/store/useAdminStore';
import { useUserStore } from '@/store/useUserStore';
import { AuthBackground } from '@/components/auth/AuthBackground';

type AuthResponse = { token?: string; user?: Record<string, unknown> };

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginAdmin } = useAdminStore();
  const { isAuthenticated, logout } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If a normal user token exists, do not show admin login.
  // (This is why you were getting "bounced back".) Give a clear action instead.
  const blockedByUserSession = isAuthenticated;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await apiClient.post<AuthResponse>('/auth/admin/login', { email, password });
      const token = resp.data?.token;
      if (!token) {
        setError('Login succeeded but no token was returned.');
        return;
      }
      loginAdmin(token, resp.data?.user);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative bg-[var(--color-bg)]">
      <div className="relative">
        <AuthBackground />
        <div className="lux-container py-12 sm:py-16">
          <div className="mx-auto max-w-xl">
            <Card className="p-6 bg-white/70 backdrop-blur border border-black/10">
              <div className="text-center">
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-text)]">Admin Access</h1>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Restricted area.</p>
              </div>

              {blockedByUserSession ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-[var(--color-primary-red)]/30 bg-white/70 px-4 py-3 text-sm text-[var(--color-text)]">
                    <span className="font-semibold text-[var(--color-primary-red)]">Blocked:</span> Logout from your
                    user session to access the hidden admin login.
                  </div>
                  <Button variant="ghost" className="w-full" onClick={logout}>
                    Logout user
                  </Button>
                </div>
              ) : (
                <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                  <div className="relative">
                    <input
                      className="peer h-12 w-full rounded-xl border border-black/15 bg-white/70 px-4 pt-4 text-[var(--color-text)] outline-none focus:border-[var(--color-primary-gold)]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      autoComplete="username"
                      placeholder=" "
                      required
                    />
                    <label className="pointer-events-none absolute left-4 top-3 text-sm text-[var(--color-muted)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs">
                      Email
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      className="peer h-12 w-full rounded-xl border border-black/15 bg-white/70 px-4 pt-4 text-[var(--color-text)] outline-none focus:border-[var(--color-primary-gold)]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      autoComplete="current-password"
                      placeholder=" "
                      required
                    />
                    <label className="pointer-events-none absolute left-4 top-3 text-sm text-[var(--color-muted)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs">
                      Password
                    </label>
                  </div>

                  {error ? (
                    <div className="rounded-xl border border-[var(--color-primary-red)]/30 bg-white/70 px-4 py-3 text-sm text-[var(--color-text)]">
                      <span className="font-semibold text-[var(--color-primary-red)]">Error:</span> {error}
                    </div>
                  ) : null}

                  <Button variant="red" className="w-full" type="submit" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign in as admin'}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

