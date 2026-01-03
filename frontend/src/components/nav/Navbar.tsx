import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '../../store/useStore';
import { Container } from '../ui/Container';

const linkBase = 'relative px-2 py-1 text-sm tracking-wide text-white/85 hover:text-fg transition';

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `${linkBase} ${isActive ? 'text-fg' : ''}`}
    >
      {({ isActive }) => (
        <span className="relative">
          {label}
          <span
            className={`pointer-events-none absolute -bottom-2 left-0 h-[2px] w-full rounded bg-highlight transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </span>
      )}
    </NavLink>
  );
}

export function Navbar() {
  const navbarScrolled = useUiStore((s) => s.navbarScrolled);
  const [open, setOpen] = useState(false);

  const links = useMemo(
    () => [
      { to: '/', label: 'Home' },
      { to: '/events', label: 'Events' },
      { to: '/talk-show', label: 'Talk Show' },
      { to: '/about', label: 'About' },
      { to: '/login', label: 'Login' },
    ],
    []
  );

  return (
    <header className="fixed left-0 top-0 z-40 w-full">
      <div
        className={`transition-all ${
          navbarScrolled ? 'bg-black/75 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <Container className="h-16 flex items-center justify-between">
          <NavLink to="/" className="font-semibold tracking-wide text-fg text-base sm:text-lg">
            Let the talent talk
          </NavLink>

          <nav className="hidden md:flex items-center gap-2">
            {links.map((l) => (
              <NavItem key={l.to} to={l.to} label={l.label} />
            ))}
          </nav>

          <button
            className="md:hidden luxe-glow inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5 text-highlight" /> : <Menu className="h-5 w-5 text-fg" />}
          </button>
        </Container>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="md:hidden border-b border-white/10 bg-black/85 backdrop-blur-xl"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Container className="py-4 flex flex-col gap-3">
              {links.map((l) => (
                <NavItem key={l.to} to={l.to} label={l.label} onClick={() => setOpen(false)} />
              ))}
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}


