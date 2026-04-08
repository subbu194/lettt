import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useAdminStore } from '@/store/useAdminStore';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { Mail, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

type AuthResponse = { user?: Record<string, unknown> };

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginAdmin } = useAdminStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await apiClient.post<AuthResponse>('/auth/admin/login', { email, password });
      loginAdmin(resp.data?.user);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen bg-(--color-background)">
      <div className="relative">
        <AuthBackground />
        <div className="lux-container py-12 sm:py-16">
          <div className="mx-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Card className="overflow-hidden border border-black/4 bg-white/75 p-0 shadow-xl backdrop-blur-xl">
                <div className="border-b border-black/6 bg-linear-to-br from-(--color-text) to-(--color-soft-black) px-6 py-8 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                      <Shield size={22} className="text-white" aria-hidden />
                    </div>
                    <div>
                      <h1 className="text-xl font-extrabold tracking-tight">Admin</h1>
                      <p className="mt-0.5 text-sm text-white/80">Restricted access — sign in to continue</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <>
                    <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-black/6 bg-white/60 p-3">
                      <Mail size={16} aria-hidden />
                      <span className="text-sm font-semibold text-(--color-text)">Email & Password</span>
                    </div>

                    <form className="space-y-4" onSubmit={onSubmit}>
                      <div className="relative">
                        <input
                          className="peer h-14 w-full rounded-xl border border-black/12 bg-white/80 px-4 pt-5 pb-2 text-(--color-text) outline-none transition focus:border-red-200 focus:ring-2 focus:ring-(--color-red)/15"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          autoComplete="username"
                          placeholder=" "
                          required
                        />
                        <label className="pointer-events-none absolute left-4 top-4 text-sm text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs">
                          Work email
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          className="peer h-14 w-full rounded-xl border border-black/12 bg-white/80 px-4 pt-5 pb-2 text-(--color-text) outline-none transition focus:border-red-200 focus:ring-2 focus:ring-(--color-red)/15"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type="password"
                          autoComplete="current-password"
                          placeholder=" "
                          required
                        />
                        <label className="pointer-events-none absolute left-4 top-4 text-sm text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs">
                          Password
                        </label>
                      </div>

                      {error ? (
                        <div className="rounded-xl border border-red-200/40 bg-red-50/60 px-4 py-3 text-sm text-(--color-text)">
                          {error}
                        </div>
                      ) : null}

                      <Button variant="red" className="h-12 w-full text-base font-semibold" type="submit" disabled={loading}>
                        {loading ? 'Signing in…' : 'Continue with email'}
                      </Button>
                    </form>
                  </>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
