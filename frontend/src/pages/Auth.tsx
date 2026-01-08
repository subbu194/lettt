import { useState } from 'react';
import { Login } from '@/components/auth/Login';
import { Signup } from '@/components/auth/Signup';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/components/shared/Button';

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const { isAuthenticated, logout } = useUserStore();

  return (
    <section className="bg-[var(--color-bg)]">
      <div className="lux-container py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight">Login / Signup</h1>
            <p className="mt-3 text-[var(--color-muted)]">A    experience starts with your membership.</p>
          </div>
          {isAuthenticated ? (
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          ) : null}
        </div>

        <div className="mt-8 flex gap-2">
          <button
            type="button"
            className={`h-11 rounded-xl px-4 text-sm font-semibold border ${
              tab === 'login'
                ? 'border-black/20 bg-black/5'
                : 'border-black/10 bg-[var(--color-bg)] hover:border-black/20'
            }`}
            onClick={() => setTab('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`h-11 rounded-xl px-4 text-sm font-semibold border ${
              tab === 'signup'
                ? 'border-black/20 bg-black/5'
                : 'border-black/10 bg-[var(--color-bg)] hover:border-black/20'
            }`}
            onClick={() => setTab('signup')}
          >
            Signup
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {tab === 'login' ? <Login /> : <Signup />}
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="text-lg font-extrabold tracking-tight">Why Let the talent talk?</div>
            <ul className="mt-4 space-y-3 text-sm text-black/70">
              <li>
                <span className="font-semibold text-black">Exclusive drops</span> and VIP event access.
              </li>
              <li>
                <span className="font-semibold text-black">   viewing</span> for talk show releases.
              </li>
              <li>
                <span className="font-semibold text-black">Fast checkout</span> for tickets and merch.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

