import { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut, Package, Ticket } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { useUserStore } from '@/store/useUserStore';
import { Cart } from '@/components/purchase/Cart';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Art', to: '/art' },
  { label: 'Events', to: '/events' },
  { label: 'Talk Show', to: '/talkshow' },
  { label: 'About Us', to: '/about' },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const openModal = useUIStore((s) => s.openModal);
  const { isAuthenticated, logout } = useUserStore();
  const cartCount = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items]);

  const activeUnderline = useMemo(
    () => 'after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:bg-[var(--color-primary-gold)]',
    []
  );

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-(--color-primary-gold) backdrop-blur">
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
                `relative text-sm font-semibold tracking-wide text-(--color-text)/80 hover:text-(--color-primary-red) ${isActive ? activeUnderline : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          
          {/* Cart Button */}
          <button
            className="relative inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-black/70 hover:text-black"
            onClick={() => openModal(<Cart />)}
            aria-label="Open cart"
            type="button"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-primary-red) px-1 text-xs text-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black/70 hover:text-black"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
                type="button"
              >
                <User className="h-5 w-5" />
              </button>
              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserMenuOpen(false)} 
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
                    <NavLink
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-black/5"
                    >
                      <Package className="h-4 w-4" />
                      My Orders
                    </NavLink>
                    <NavLink
                      to="/my-tickets"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-black/5"
                    >
                      <Ticket className="h-4 w-4" />
                      My Tickets
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 border-t border-black/10 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <NavLink
              to="/auth"
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80"
            >
              Login
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white"
            onClick={() => openModal(<Cart />)}
            aria-label="Open cart"
            type="button"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-primary-red) px-1 text-xs text-white">
                {cartCount}
              </span>
            ) : null}
          </button>
          <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-(--color-primary-gold) md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          type="button"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        </div>
      </div>

      {open ? (
        <div
          className="border-t border-black/10 bg-(--color-primary-gold) md:hidden"
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
                      isActive ? 'bg-black/5 text-(--color-primary-red)' : 'hover:bg-black/5 hover:text-(--color-primary-red)'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              
              {/* Mobile User Links */}
              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/orders"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide ${
                        isActive ? 'bg-black/5 text-(--color-primary-red)' : 'hover:bg-black/5 hover:text-(--color-primary-red)'
                      }`
                    }
                  >
                    <Package className="h-4 w-4" />
                    My Orders
                  </NavLink>
                  <NavLink
                    to="/my-tickets"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide ${
                        isActive ? 'bg-black/5 text-(--color-primary-red)' : 'hover:bg-black/5 hover:text-(--color-primary-red)'
                      }`
                    }
                  >
                    <Ticket className="h-4 w-4" />
                    My Tickets
                  </NavLink>
                  <button
                    onClick={() => { handleLogout(); setOpen(false); }}
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <NavLink
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Login / Sign Up
                </NavLink>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

