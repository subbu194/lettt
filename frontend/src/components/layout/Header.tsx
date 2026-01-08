import { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Events', to: '/events' },
  { label: 'Talk Show', to: '/talkshow' },
  { label: 'Purchase', to: '/purchase' },
  { label: 'About Us', to: '/about' },
  { label: 'Login/Signup', to: '/auth' },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const activeUnderline = useMemo(
    () => 'after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:bg-[var(--color-primary-gold)]',
    []
  );

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-[var(--color-primary-gold)] backdrop-blur">
      <div className="lux-container flex h-16 items-center justify-between gap-4">
        <button
          className="text-left luckiest-guy-regular text-xl tracking-[0.18em]"
          onClick={() => {
            if (location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              return;
            }
            navigate('/');
          }}
          aria-label="Let the talent talk home"
          type="button"
        >
          Let the talent talk
        </button>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `relative text-sm font-semibold tracking-wide text-[var(--color-text)]/80 hover:text-[var(--color-primary-red)] ${isActive ? activeUnderline : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-[var(--color-primary-gold)] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          type="button"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div
          className="border-t border-black/10 bg-[var(--color-primary-gold)] md:hidden"
          style={{ animation: 'slideDown 220ms ease both' }}
        >
          <div className="lux-container py-4">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-semibold tracking-wide ${
                      isActive ? 'bg-black/5 text-[var(--color-primary-red)]' : 'hover:bg-black/5 hover:text-[var(--color-primary-red)]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

