import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Package, Ticket, UserCog, ChevronRight } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Art', to: '/art' },
  { label: 'Events', to: '/events' },
  { label: 'Talk Show', to: '/talkshow' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'About Us', to: '/about' },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useUserStore();

  // Track scroll for header shrink effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); setUserMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const getInitials = () => {
    if (user && typeof user.name === 'string' && user.name) return user.name.charAt(0).toUpperCase();
    if (user && typeof user.email === 'string' && user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const userProfileImage = user && typeof user.profileImage === 'string' ? user.profileImage : null;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'shadow-lg'
            : ''
        }`}
      >
        {/* ── Logo Bar ── */}
        <div className={`transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-black/4' : 'bg-white border-b border-black/4'}`}>
          <div className={`flex items-center justify-center transition-all duration-500 ${scrolled ? 'h-14' : 'h-20'} px-5 sm:px-8`}>
            <button
              className={`text-center luckiest-guy-regular tracking-[0.12em] font-bold bg-linear-to-r from-red-700 via-red-500 to-red-700 bg-size-[200%_100%] bg-clip-text text-transparent animate-[gradient-flow_4s_ease-in-out_infinite] transition-all duration-500 ${
                scrolled ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl'
              }`}
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
          </div>
        </div>

        {/* ── Navigation Bar ── */}
        <div className="bg-linear-to-r from-red-700 via-red-600 to-red-700 relative">
          {/* Subtle shine overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-white/8 to-transparent pointer-events-none" />

          <div className="flex h-12 items-center justify-between px-5 sm:px-8 relative">
            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 md:flex flex-1 justify-center" aria-label="Primary navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative px-4 py-2 text-[13px] font-semibold tracking-wide uppercase transition-all duration-300 rounded-lg ${
                      isActive
                        ? 'text-white bg-white/15'
                        : 'text-white/75 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-white rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/30 bg-white text-(--color-soft-black) hover:ring-white/60 transition-all duration-300"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-label="User menu"
                    type="button"
                  >
                    {userProfileImage ? (
                      <img src={userProfileImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{getInitials()}</span>
                    )}
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div
                        className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl bg-white shadow-xl border border-black/4"
                        style={{ animation: 'slideDown 200ms ease-out both' }}
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 bg-gray-50/80 border-b border-black/4">
                          <p className="text-sm font-bold text-(--color-soft-black) truncate">{String(user?.name || 'User')}</p>
                          <p className="text-xs text-(--color-muted) truncate">{String(user?.email || '')}  </p>
                        </div>
                        <div className="py-1">
                          <NavLink
                            to="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-(--color-soft-black) hover:bg-gray-50 transition-colors group"
                          >
                            <UserCog className="h-4 w-4 text-(--color-muted) group-hover:text-(--color-red) transition-colors" />
                            Profile
                            <ChevronRight className="h-3 w-3 ml-auto text-(--color-muted) opacity-0 group-hover:opacity-100 transition-opacity" />
                          </NavLink>
                          <NavLink
                            to="/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-(--color-soft-black) hover:bg-gray-50 transition-colors group"
                          >
                            <Package className="h-4 w-4 text-(--color-muted) group-hover:text-(--color-red) transition-colors" />
                            My Orders
                            <ChevronRight className="h-3 w-3 ml-auto text-(--color-muted) opacity-0 group-hover:opacity-100 transition-opacity" />
                          </NavLink>
                          <NavLink
                            to="/my-tickets"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-(--color-soft-black) hover:bg-gray-50 transition-colors group"
                          >
                            <Ticket className="h-4 w-4 text-(--color-muted) group-hover:text-(--color-red) transition-colors" />
                            My Tickets
                            <ChevronRight className="h-3 w-3 ml-auto text-(--color-muted) opacity-0 group-hover:opacity-100 transition-opacity" />
                          </NavLink>
                        </div>
                        <div className="border-t border-black/4 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-(--color-red) hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <NavLink
                  to="/auth"
                  className="rounded-lg bg-white px-5 py-1.5 text-[13px] font-bold text-(--color-red) hover:bg-white/90 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Sign In
                </NavLink>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden w-full justify-end">
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors duration-200"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                type="button"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu Overlay ── */}
        {open && (
          <div className="md:hidden">
            {/* Backdrop */}
            <div className="fixed inset-0 top-[calc(var(--header-h,8rem))] bg-black/40 z-40" onClick={() => setOpen(false)} />

            {/* Menu Panel */}
            <div
              className="relative z-50 border-t border-white/10 bg-linear-to-b from-red-700 to-red-800"
              style={{ animation: 'slideDown 250ms ease-out both' }}
            >
              <div className="px-4 py-4">
                <div className="grid gap-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span>{item.label}</span>
                          {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
                        </>
                      )}
                    </NavLink>
                  ))}

                  <div className="my-2 h-px bg-white/10" />

                  {isAuthenticated ? (
                    <>
                      <NavLink
                        to="/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <UserCog className="h-4 w-4" /> Profile
                      </NavLink>
                      <NavLink
                        to="/orders"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Package className="h-4 w-4" /> My Orders
                      </NavLink>
                      <NavLink
                        to="/my-tickets"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Ticket className="h-4 w-4" /> My Tickets
                      </NavLink>
                      <button
                        onClick={() => { handleLogout(); setOpen(false); }}
                        className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 transition-all mt-1"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <NavLink
                      to="/auth"
                      onClick={() => setOpen(false)}
                      className="rounded-xl bg-white px-4 py-3.5 text-center text-sm font-bold text-(--color-red) hover:bg-white/90 transition-all mt-1 shadow-lg"
                    >
                      Sign In / Create Account
                    </NavLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Header spacer to prevent content from going under fixed header */}
      <div className="h-32" aria-hidden="true" />
    </>
  );
}

