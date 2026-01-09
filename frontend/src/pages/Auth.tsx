import { useEffect, useState } from 'react';
import { Login } from '@/components/auth/Login';
import { Signup } from '@/components/auth/Signup';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/components/shared/Button';
import { AuthBackground } from '@/components/auth/AuthBackground';

type Props = {
  initialTab?: 'login' | 'signup';
};

export default function AuthPage({ initialTab }: Props) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab ?? 'login');
  const { isAuthenticated, logout } = useUserStore();

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  return (
    <section className="relative bg-[var(--color-bg)]">
      <div className="relative">
        <AuthBackground />
        <div className="lux-container py-12 sm:py-16">
          <div className="mx-auto w-full max-w-xl">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight">
                <span className="animated-gradient-text">Welcome</span>
              </h1>
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Sign in to continue, or create your account.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-2 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`h-11 rounded-xl text-sm font-semibold transition ${
                    tab === 'login'
                      ? 'bg-[var(--color-text)] text-[var(--color-primary-gold)]'
                      : 'bg-white/60 text-[var(--color-text)] hover:bg-white/80'
                  }`}
                  onClick={() => setTab('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`h-11 rounded-xl text-sm font-semibold transition ${
                    tab === 'signup'
                      ? 'bg-[var(--color-text)] text-[var(--color-primary-gold)]'
                      : 'bg-white/60 text-[var(--color-text)] hover:bg-white/80'
                  }`}
                  onClick={() => setTab('signup')}
                >
                  Signup
                </button>
              </div>
            </div>

            <div className="mt-4">
              {tab === 'login' ? <Login /> : <Signup />}
            </div>

            {isAuthenticated ? (
              <div className="mt-4 flex justify-center">
                <Button variant="ghost" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}


