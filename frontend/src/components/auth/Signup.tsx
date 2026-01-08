import { useState } from 'react';
import { post } from '@/api/client';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useUserStore } from '@/store/useUserStore';

type AuthResponse = { token?: string; user?: Record<string, unknown> };

export function Signup() {
  const login = useUserStore((s) => s.login);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error } = await post<AuthResponse>('/auth/register', { name, email, password });
    setLoading(false);

    if (error) {
      setError(error);
      return;
    }

    const token = data?.token;
    if (token) {
      login(token, data?.user);
      return;
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-extrabold tracking-tight">Signup</h2>
      <p className="mt-2 text-sm text-black/70">Join Let the talent talk to access    content and ticket purchases.</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-black/70">Name</span>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white px-4"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            autoComplete="name"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-black/70">Email</span>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white px-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-black/70">Password</span>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white px-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
        </label>

        {error ? <div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70">{error}</div> : null}

        <Button variant="gold" className="w-full" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </Button>
      </form>
    </Card>
  );
}

