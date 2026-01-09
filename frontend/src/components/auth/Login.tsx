import { useState } from 'react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useUserStore } from '@/store/useUserStore';

type AuthResponse = { token?: string; user?: Record<string, unknown> };

export function Login() {
  const login = useUserStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      const token = resp.data?.token;
      if (!token) {
        setError('Login succeeded but no token was returned.');
        return;
      }
      login(token, resp.data?.user);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-white/70 backdrop-blur border border-black/10">
      <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-text)]">Sign in</h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">Enter your email and password.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="relative">
          <input
            className="peer h-12 w-full rounded-xl border border-black/15 bg-white/70 px-4 pt-4 text-[var(--color-text)] outline-none focus:border-[var(--color-primary-gold)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
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
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Card>
  );
}


