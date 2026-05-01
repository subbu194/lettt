import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Package, Ticket, UserCog, ChevronRight, Search } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchSearchSuggestions, type SearchScope, type SearchSuggestion } from '@/api/search';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Blog', to: '/blog' },
  { label: 'Art', to: '/art' },
  { label: 'Artists', to: '/artists' },
  { label: 'Events', to: '/events' },
  { label: 'Talk Show', to: '/talkshow' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'About Us', to: '/about' },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [typingEffect, setTypingEffect] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);

  // Mobile/tablet: search bar toggles open via icon click
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useUserStore();
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchWrapRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const debouncedSearch = useDebounce(searchQuery.trim(), 220);

  const searchScope = useMemo<SearchScope>(() => {
    if (location.pathname === '/') return 'all';
    if (location.pathname.startsWith('/art')) return 'art';
    if (location.pathname.startsWith('/artists')) return 'artists';
    if (location.pathname.startsWith('/events') || location.pathname.startsWith('/event-checkout')) return 'events';
    if (location.pathname.startsWith('/talkshow')) return 'talkshow';
    if (location.pathname.startsWith('/gallery')) return 'gallery';
    if (location.pathname.startsWith('/blog') || location.pathname.startsWith('/catalog')) return 'blogs';
    return 'all';
  }, [location.pathname]);

  const searchPlaceholder = useMemo(() => {
    if (searchScope === 'all') return 'Search art, artists, events...';
    if (searchScope === 'art') return 'Search art...';
    if (searchScope === 'artists') return 'Search artists...';
    if (searchScope === 'events') return 'Search event...';
    if (searchScope === 'talkshow') return 'Search talk show...';
    if (searchScope === 'gallery') return 'Search gallery...';
    return 'Search blog...';
  }, [searchScope]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchLoading(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!searchQuery.trim()) { setTypingEffect(false); return; }
    setTypingEffect(true);
    const id = window.setTimeout(() => setTypingEffect(false), 180);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  // Close desktop search dropdown on outside click
  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (mobileSearchWrapRef.current && !mobileSearchWrapRef.current.contains(event.target as Node)) {
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Focus mobile input when it opens
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (debouncedSearch.length < 2) { setSearchResults([]); setSearchLoading(false); return; }
    let isCancelled = false;
    const runSearch = async () => {
      try {
        setSearchLoading(true);
        const suggestions = await fetchSearchSuggestions({ q: debouncedSearch, scope: searchScope, limit: 8 });
        if (!isCancelled) setSearchResults(suggestions);
      } catch {
        if (!isCancelled) setSearchResults([]);
      } finally {
        if (!isCancelled) setSearchLoading(false);
      }
    };
    void runSearch();
    return () => { isCancelled = true; };
  }, [debouncedSearch, searchScope]);

  const handleLogout = async () => { await logout(); setUserMenuOpen(false); navigate('/'); };

  const getInitials = () => {
    if (user && typeof user.name === 'string' && user.name) return user.name.charAt(0).toUpperCase();
    if (user && typeof user.email === 'string' && user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const userProfileImage = user && typeof user.profileImage === 'string' ? user.profileImage : null;

  const handleSearchSelect = (item: SearchSuggestion) => {
    setSearchQuery('');
    setSearchOpen(false);
    setMobileSearchOpen(false);
    const fromHome = location.pathname === '/';
    if (fromHome && item.type === 'event') { navigate('/events', { state: { openEventId: item.id } }); return; }
    if (fromHome && item.type === 'art') { navigate('/art', { state: { openArtId: item.id } }); return; }
    if (fromHome && item.type === 'blog') { const blogSlug = item.href.replace('/blog/', ''); navigate('/blog', { state: { openBlogSlug: blogSlug } }); return; }
    if (item.type === 'talkshow') { navigate('/talkshow', { state: { openVideoId: item.id } }); return; }
    navigate(item.href);
  };

  const getTypeLabel = (type: SearchSuggestion['type']) => {
    if (type === 'art') return 'Art';
    if (type === 'artist') return 'Artist';
    if (type === 'event') return 'Event';
    if (type === 'talkshow') return 'Talk Show';
    if (type === 'gallery') return 'Gallery';
    return 'Blog';
  };

  // ── Shared search results dropdown ──
  const SearchDropdown = ({ wide = false }: { wide?: boolean }) => (
    searchOpen && searchQuery.trim().length > 0 ? (
      <div className={`absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-black/8 bg-white shadow-2xl ${wide ? 'left-0 right-0' : 'right-0 w-96 max-w-[calc(100vw-2rem)]'}`}>
        {searchLoading ? (
          <div className="px-5 py-4 text-sm text-(--color-muted)">Searching...</div>
        ) : searchResults.length === 0 ? (
          <div className="px-5 py-4 text-sm text-(--color-muted)">No results found</div>
        ) : (
          <div className="max-h-80 overflow-y-auto py-2">
            {searchResults.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                onClick={() => handleSearchSelect(item)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-black/5">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-(--color-muted)">{getTypeLabel(item.type)}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-(--color-soft-black)">{item.title}</p>
                  <p className="truncate text-xs text-(--color-muted)">{item.subtitle}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-(--color-muted)">
                  {getTypeLabel(item.type)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    ) : null
  );

  // ── Shared auth button / avatar ──
  const AuthSection = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
    isAuthenticated ? (
      <div className="relative shrink-0">
        <button
          className={`inline-flex items-center justify-center overflow-hidden rounded-full ring-2 ring-white/30 bg-white text-(--color-soft-black) hover:ring-white/60 transition-all duration-300 ${size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'}`}
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          aria-label="User menu"
          type="button"
        >
          {userProfileImage ? (
            <img src={userProfileImage} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className={`font-bold ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>{getInitials()}</span>
          )}
        </button>
        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl bg-white shadow-xl border border-black/4" style={{ animation: 'slideDown 200ms ease-out both' }}>
              <div className="px-4 py-3 bg-gray-50/80 border-b border-black/4">
                <p className="text-sm font-bold text-(--color-soft-black) truncate">{String(user?.name || 'User')}</p>
                <p className="text-xs text-(--color-muted) truncate">{String(user?.email || '')}</p>
              </div>
              <div className="py-1">
                <NavLink to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-(--color-soft-black) hover:bg-gray-50 transition-colors group">
                  <UserCog className="h-4 w-4 text-(--color-muted) group-hover:text-(--color-red) transition-colors" />
                  Profile
                  <ChevronRight className="h-3 w-3 ml-auto text-(--color-muted) opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
                <NavLink to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-(--color-soft-black) hover:bg-gray-50 transition-colors group">
                  <Package className="h-4 w-4 text-(--color-muted) group-hover:text-(--color-red) transition-colors" />
                  My Orders
                  <ChevronRight className="h-3 w-3 ml-auto text-(--color-muted) opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
                <NavLink to="/my-tickets" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-(--color-soft-black) hover:bg-gray-50 transition-colors group">
                  <Ticket className="h-4 w-4 text-(--color-muted) group-hover:text-(--color-red) transition-colors" />
                  My Tickets
                  <ChevronRight className="h-3 w-3 ml-auto text-(--color-muted) opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
              </div>
              <div className="border-t border-black/4 py-1">
                <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-(--color-red) hover:bg-red-50 transition-colors">
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
        className={`shrink-0 rounded-lg bg-white font-bold text-(--color-red) hover:bg-white/90 transition-all duration-300 shadow-sm whitespace-nowrap ${size === 'sm' ? 'px-3 py-1 text-[11px]' : 'px-4 py-1.5 text-[13px]'}`}
      >
        Sign In
      </NavLink>
    )
  );

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? 'shadow-lg' : ''}`}>

        {/* ── Logo Bar ── */}
        <div className={`transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-black/4' : 'bg-white border-b border-black/4'}`}>
          <div className={`flex items-center justify-center transition-all duration-500 ${scrolled ? 'h-14' : 'h-20'} px-5 sm:px-8`}>
            <button
              className={`text-center luckiest-guy-regular tracking-[0.12em] font-bold bg-linear-to-r from-red-700 via-red-500 to-red-700 bg-size-[200%_100%] bg-clip-text text-transparent animate-[gradient-flow_4s_ease-in-out_infinite] transition-all duration-500 ${scrolled ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl'}`}
              onClick={() => { if (location.pathname === '/') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } navigate('/'); }}
              aria-label="let the talent talk home"
              type="button"
            >
              LET THE TALENT TALK
            </button>
          </div>
        </div>

        {/* ── Navigation Bar ── */}
        <div className="bg-linear-to-r from-red-700 via-red-600 to-red-700 relative">
          <div className="absolute inset-0 bg-linear-to-b from-white/8 to-transparent pointer-events-none" />

          {/* ── LARGE DESKTOP (lg+): single row, nav centered, search+auth right ── */}
          <div className="hidden lg:flex h-12 items-center justify-between px-5 xl:px-8 relative">
            <div className="w-72 shrink-0" />
            <nav className="flex items-center gap-0.5 xl:gap-1" aria-label="Primary navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative px-3 xl:px-4 py-2 text-[12px] xl:text-[13px] font-semibold tracking-wide uppercase transition-all duration-300 rounded-lg whitespace-nowrap ${isActive ? 'text-white bg-white/15' : 'text-white/75 hover:text-white hover:bg-white/10'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-white rounded-full" />}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-56 xl:w-64" ref={searchWrapRef}>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); if (!searchOpen) setSearchOpen(true); }}
                    onFocus={() => { setSearchOpen(true); setSearchFocused(true); }}
                    onBlur={() => setSearchFocused(false)}
                    placeholder={searchPlaceholder}
                    className={`h-9 w-full rounded-lg pl-9 pr-3 text-sm text-(--color-soft-black) placeholder:text-black/60 outline-none transition-all duration-200 ease-out ${searchFocused ? 'border border-black/25 bg-white shadow-md scale-[1.01]' : 'border border-black/12 bg-white/98 shadow-sm'} ${typingEffect ? 'scale-[1.02]' : ''}`}
                  />
                </div>
                <SearchDropdown />
              </div>
              <AuthSection size="md" />
            </div>
          </div>

          {/* ── TABLET (md–lg): single row, nav left-aligned, search icon + auth right ── */}
          <div className="hidden md:flex lg:hidden h-12 items-center px-4 gap-2 relative">
            {/* Nav left-aligned, no centering */}
            <nav className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-none" aria-label="Primary navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative px-2.5 py-1.5 text-[11px] font-semibold tracking-wide uppercase transition-all duration-300 rounded-lg whitespace-nowrap flex-shrink-0 ${isActive ? 'text-white bg-white/15' : 'text-white/75 hover:text-white hover:bg-white/10'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Right: search toggle + auth — wrapped together so they never separate */}
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              {/* Search toggle wrapper — ref for outside-click detection */}
              <div className="relative flex items-center" ref={mobileSearchWrapRef}>
                {mobileSearchOpen ? (
                  <div className="flex items-center gap-1.5" style={{ animation: 'slideDown 150ms ease-out both' }}>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/60" />
                      <input
                        ref={mobileSearchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                        onFocus={() => { setSearchOpen(true); setSearchFocused(true); }}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="Search..."
                        className="h-8 w-28 rounded-lg pl-8 pr-2 text-xs text-(--color-soft-black) placeholder:text-black/50 outline-none border border-black/12 bg-white/98 shadow-sm focus:border-black/25 focus:shadow-md transition-all"
                      />
                      {searchOpen && searchQuery.trim().length > 0 && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-4rem)] overflow-hidden rounded-2xl border border-black/8 bg-white shadow-2xl">
                          {searchLoading ? (
                            <div className="px-4 py-3 text-sm text-(--color-muted)">Searching...</div>
                          ) : searchResults.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-(--color-muted)">No results found</div>
                          ) : (
                            <div className="max-h-72 overflow-y-auto py-1.5">
                              {searchResults.map((item) => (
                                <button
                                  key={`${item.type}-${item.id}`}
                                  type="button"
                                  onClick={() => handleSearchSelect(item)}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-gray-50 transition-colors"
                                >
                                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-black/5">
                                    {item.image ? (
                                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-(--color-muted)">{getTypeLabel(item.type)}</div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-(--color-soft-black)">{item.title}</p>
                                    <p className="truncate text-[11px] text-(--color-muted)">{item.subtitle}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMobileSearchOpen(false); setSearchOpen(false); }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors"
                      aria-label="Close search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMobileSearchOpen(true)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors"
                    aria-label="Open search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                )}
              </div>

              <AuthSection size="sm" />
            </div>
          </div>

          {/* ── MOBILE (<md): single row — hamburger left, logo center area used by logo bar, search icon + auth right ── */}
          <div className="flex md:hidden h-11 items-center px-3 gap-2 relative">
            {/* Hamburger — left */}
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors duration-200 shrink-0"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              type="button"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Spacer to push search+auth to the right */}
            <div className="flex-1" />

            {/* Search icon + auth — always together on the right */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative flex items-center" ref={mobileSearchWrapRef}>
                {mobileSearchOpen ? (
                  <div className="flex items-center gap-1.5" style={{ animation: 'slideDown 150ms ease-out both' }}>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/60" />
                      <input
                        ref={mobileSearchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                        onFocus={() => { setSearchOpen(true); setSearchFocused(true); }}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="Search..."
                        className="h-8 w-24 sm:w-32 rounded-lg pl-8 pr-2 text-xs text-(--color-soft-black) placeholder:text-black/50 outline-none border border-black/12 bg-white/98 shadow-sm focus:border-black/25 focus:shadow-md transition-all"
                      />
                      {searchOpen && searchQuery.trim().length > 0 && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-black/8 bg-white shadow-2xl">
                          {searchLoading ? (
                            <div className="px-4 py-3 text-sm text-(--color-muted)">Searching...</div>
                          ) : searchResults.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-(--color-muted)">No results found</div>
                          ) : (
                            <div className="max-h-64 overflow-y-auto py-1.5">
                              {searchResults.map((item) => (
                                <button
                                  key={`${item.type}-${item.id}`}
                                  type="button"
                                  onClick={() => handleSearchSelect(item)}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-gray-50 transition-colors"
                                >
                                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-black/5">
                                    {item.image ? (
                                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-(--color-muted)">{getTypeLabel(item.type)}</div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-(--color-soft-black)">{item.title}</p>
                                    <p className="truncate text-[11px] text-(--color-muted)">{item.subtitle}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMobileSearchOpen(false); setSearchOpen(false); }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors"
                      aria-label="Close search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMobileSearchOpen(true)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/15 transition-colors"
                    aria-label="Open search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                )}
              </div>

              <AuthSection size="sm" />
            </div>
          </div>
        </div>

        {/* ── Mobile Menu Overlay ── */}
        {open && (
          <div className="md:hidden">
            <div className="fixed inset-0 top-[calc(var(--header-h,8rem))] bg-black/40 z-40" onClick={() => setOpen(false)} />
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
                        `flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 ${isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`
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
                      <NavLink to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all">
                        <UserCog className="h-4 w-4" /> Profile
                      </NavLink>
                      <NavLink to="/orders" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all">
                        <Package className="h-4 w-4" /> My Orders
                      </NavLink>
                      <NavLink to="/my-tickets" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all">
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

      {/* Header spacer */}
      <div className="h-32" aria-hidden="true" />
    </>
  );
}