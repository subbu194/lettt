import { useState } from 'react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useUserStore } from '@/store/useUserStore';

type AuthResponse = { token?: string; user?: Record<string, unknown> };

export function Signup() {
  const login = useUserStore((s) => s.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    return score; // 0..4
  })();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!acceptTerms) {
      setError('Please accept the terms to continue.');
      return;
    }
    setLoading(true);
    try {
      const resp = await apiClient.post<AuthResponse>('/auth/signup', { name, email, password });
      const token = resp.data?.token;
      if (!token) {
        setError('Signup succeeded but no token was returned.');
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
      <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-text)]">Create account</h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">Use your details to get started.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="relative">
          <input
            className="peer h-12 w-full rounded-xl border border-black/15 bg-white/70 px-4 pt-4 text-[var(--color-text)] outline-none focus:border-[var(--color-primary-gold)]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            autoComplete="name"
            placeholder=" "
            required
          />
          <label className="pointer-events-none absolute left-4 top-3 text-sm text-[var(--color-muted)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs">
            Name
          </label>
        </div>

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
            autoComplete="new-password"
            placeholder=" "
            required
          />
          <label className="pointer-events-none absolute left-4 top-3 text-sm text-[var(--color-muted)] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs">
            Password
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
            <span>Password strength</span>
            <span>{strength >= 3 ? 'Strong' : strength === 2 ? 'Medium' : 'Weak'}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full border border-black/10 ${
                  i < strength ? 'bg-[var(--color-primary-gold)] glow-gold' : 'bg-white/60'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-[var(--color-muted)]">
            Use 8+ chars with uppercase, lowercase, and a number.
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-sm text-[var(--color-text)]">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[var(--color-primary-red)]"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
          />
          <span>
            I agree to the <span className="font-semibold text-[var(--color-primary-red)]">Terms</span> and{' '}
            <span className="font-semibold text-[var(--color-primary-red)]">Privacy</span>.
          </span>
        </label>

        {error ? (
          <div className="rounded-xl border border-[var(--color-primary-red)]/30 bg-white/70 px-4 py-3 text-sm text-[var(--color-text)]">
            <span className="font-semibold text-[var(--color-primary-red)]">Error:</span> {error}
          </div>
        ) : null}

        <Button variant="gold" className="w-full" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </Button>
      </form>
    </Card>
  );
}


