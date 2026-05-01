import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight, Grid3X3, LayoutList, X } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { PageTransition } from '@/components/shared/PageTransition';
import { SkeletonCard } from '@/components/shared/Skeleton';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useDebounce } from '@/hooks/useDebounce';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Artist {
  _id: string;
  name: string;
  image?: string;
  artType: string;
  grade: string;
  phone: string;
  whatsapp: string;
  bio?: string;
  featured?: boolean;
  isActive?: boolean;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ArtistsResponse {
  items: Artist[];
  pagination: PaginationData;
}

// ─────────────────────────────────────────────────────────────
// Artist Card Component
// ─────────────────────────────────────────────────────────────

function ArtistCard({ artist }: { artist: Artist }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      <Link to={`/artists/${artist._id}`}>
        <Card className="overflow-hidden transition-all hover:shadow-lg">
          {/* Image Container */}
          <div className="relative aspect-4/5 overflow-hidden bg-linear-to-br from-black/5 to-black/10">
            {artist.image ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 animate-pulse bg-linear-to-br from-black/5 to-black/10" />
                )}
                <motion.img
                  src={artist.image}
                  alt={artist.name}
                  className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-4xl opacity-20">👤</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute left-3 top-3 flex flex-col gap-2">
              {artist.featured && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-(--color-red) shadow-md">
                  Featured
                </span>
              )}
              {!artist.isActive && (
                <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white shadow-md">
                  Unavailable
                </span>
              )}
            </div>
          </div>

           {/* Content */}
           <div className="p-5">
             <span className="text-xs font-semibold uppercase tracking-wider text-(--color-muted)">
               {artist.artType}
             </span>
             <h3 className="mt-1 text-lg font-extrabold tracking-tight line-clamp-1">{artist.name}</h3>
             <p className="mt-1 text-sm text-(--color-muted)">Grade: {artist.grade}</p>
             {artist.bio && (
               <p className="mt-2 text-xs text-(--color-muted) line-clamp-2">{artist.bio}</p>
             )}
             {/* Contact Buttons */}
             <div className="mt-3 flex flex-wrap gap-2">
               <button
                 onClick={() => {
                   window.location.href = `tel:${artist.phone}`;
                 }}
                 className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black/8 bg-white p-1.5 hover:border-red-200 hover:shadow-md transition-all group"
               >
                 <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 group-hover:bg-green-100 transition-colors">
                   <Phone className="h-4 w-4 text-green-600" />
                 </div>
               </button>
               <button
                 onClick={() => {
                   const message = encodeURIComponent(`Hi ${artist.name}! I'm interested in booking/commissioning your art. Please share more details about your services.`);
                   window.open(`https://wa.me/${artist.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
                 }}
                 className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black/8 bg-white p-1.5 hover:border-green-200 hover:shadow-md transition-all group"
               >
                 <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 group-hover:bg-green-100 transition-colors">
                   <MessageCircle className="h-4 w-4 text-green-600" />
                 </div>
               </button>
             </div>
           </div>
        </Card>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter Panel Component
// ─────────────────────────────────────────────────────────────

interface FilterPanelProps {
  artTypes: string[];
  selectedArtType: string;
  onArtTypeChange: (type: string) => void;
  grades: string[];
  selectedGrade: string;
  onGradeChange: (grade: string) => void;
  showFeatured: boolean;
  onFeaturedChange: (val: boolean) => void;
  showActive: boolean;
  onActiveChange: (val: boolean) => void;
  onReset: () => void;
}

function FilterPanel({
  artTypes,
  selectedArtType,
  onArtTypeChange,
  grades,
  selectedGrade,
  onGradeChange,
  showFeatured,
  onFeaturedChange,
  showActive,
  onActiveChange,
  onReset,
}: FilterPanelProps) {
  const hasFilters = selectedArtType || selectedGrade || showFeatured || showActive;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-6">
          {/* Art Type Filter */}
          <div className="min-w-40">
            <label className="mb-2 block text-sm font-semibold text-(--color-muted)">Art Type</label>
            <select
              value={selectedArtType}
              onChange={(e) => onArtTypeChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-black/4 bg-white px-4 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
            >
              <option value="">All Types</option>
              {artTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div className="min-w-40">
            <label className="mb-2 block text-sm font-semibold text-(--color-muted)">Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => onGradeChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-black/4 bg-white px-4 text-sm focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
            >
              <option value="">All Grades</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col gap-3">
            <label className="mb-2 block text-sm font-semibold text-(--color-muted)">Quick Filters</label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showFeatured}
                onChange={(e) => onFeaturedChange(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 text-(--color-red) focus:ring-(--color-red)"
              />
              <span className="text-sm">Featured Only</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showActive}
                onChange={(e) => onActiveChange(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 text-(--color-red) focus:ring-(--color-red)"
              />
              <span className="text-sm">Available Only</span>
            </label>
          </div>

          {/* Reset Button */}
          {hasFilters && (
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={onReset}>
                <X className="h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pagination Component
// ─────────────────────────────────────────────────────────────

function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages, total, hasNext, hasPrev } = pagination;
  const pages = [];
  const maxVisible = 5;

  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <span className="text-sm text-(--color-muted)">
        Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, total)} of {total} artists
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/4 bg-white text-sm transition-colors hover:border-black/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {start > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/4 bg-white text-sm transition-colors hover:border-black/20"
            >
              1
            </button>
            {start > 2 && <span className="px-1 text-(--color-muted)">...</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm transition-colors ${
              p === page
                ? 'border-red-200 bg-(--color-red) font-bold text-white'
                : 'border-black/4 bg-white hover:border-black/20'
            }`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-(--color-muted)">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/4 bg-white text-sm transition-colors hover:border-black/20"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/4 bg-white text-sm transition-colors hover:border-black/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Artists Page Component
// ─────────────────────────────────────────────────────────────

export default function ArtistsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<Artist[]>([]);
  const [artTypes, setArtTypes] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>(['Beginner', 'Intermediate', 'Advanced', 'Expert']);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtType, setSelectedArtType] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [showFeatured, setShowFeatured] = useState(false);
  const [showActive, setShowActive] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    const state = location.state as { openArtistId?: string } | null;
    if (!state?.openArtistId) return;
    navigate(`/artists/${state.openArtistId}`);
  }, [location.state, navigate]);

  // Fetch art types on mount
  useEffect(() => {
    const fetchDistinct = async () => {
      try {
        const resp = await apiClient.get('/art/categories');
        setArtTypes(resp.data?.categories || []);
      } catch {
        // Ignore - art types are optional
      }
    };
    fetchDistinct();
  }, []);

  // Fetch artists
  const fetchArtists = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedArtType) params.set('artType', selectedArtType);
      if (selectedGrade) params.set('grade', selectedGrade);
      if (showFeatured) params.set('featured', 'true');
      if (showActive) params.set('active', 'true');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const resp = await apiClient.get<ArtistsResponse>(`/artists?${params.toString()}`);
      setItems(resp.data?.items || []);
      setPagination(p => resp.data?.pagination || p);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedArtType, selectedGrade, showFeatured, showActive, sortBy, sortOrder]);

  useEffect(() => {
    fetchArtists(1);
  }, [fetchArtists]);

  const handlePageChange = (newPage: number) => {
    fetchArtists(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSelectedArtType('');
    setSelectedGrade('');
    setShowFeatured(false);
    setShowActive(false);
    setSearchQuery('');
  };

  const activeFiltersCount = [
    selectedArtType,
    selectedGrade,
    showFeatured,
    showActive,
  ].filter(Boolean).length;

  return (
    <PageTransition>
      <section className="min-h-screen bg-(--color-background)">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-(--color-soft-black) py-16 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-red-600/15 blur-[120px]" />
          <div className="absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-red-600/10 blur-[100px]" />
          <div className="lux-container relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">Meet the Artists</span>
              <h1 className="mt-4 text-5xl font-extrabold tracking-tight md:text-6xl">
                Discover Creative <span className="text-gradient-red">Minds</span>
              </h1>
              <p className="mt-4 text-lg text-white/60">
                Connect with talented artists from around the world. Explore their portfolios, styles, and book a commission today.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="lux-container py-8">
          {/* Search & Controls Bar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--color-muted)" />
              <input
                type="text"
                placeholder="Search artists by name, style..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-black/4 bg-white pl-12 pr-4 text-sm transition-all focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Filter Toggle */}
              <Button
                variant={showFilters ? 'red' : 'ghost'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-(--color-red)">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {/* Sort Dropdown */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                className="h-10 rounded-xl border border-black/4 bg-white px-3 text-sm focus:border-red-200 focus:outline-none"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="grade-asc">Grade: Low to High</option>
                <option value="grade-desc">Grade: High to Low</option>
              </select>

              {/* View Mode Toggle */}
              <div className="hidden items-center gap-1 rounded-xl border border-black/4 bg-white p-1 sm:flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-xl p-2 transition-colors ${viewMode === 'grid' ? 'bg-(--color-red) text-white' : 'hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-xl p-2 transition-colors ${viewMode === 'list' ? 'bg-(--color-red) text-white' : 'hover:bg-gray-50'}`}
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <div className="mb-6">
                <FilterPanel
                  artTypes={artTypes}
                  selectedArtType={selectedArtType}
                  onArtTypeChange={setSelectedArtType}
                  grades={grades}
                  selectedGrade={selectedGrade}
                  onGradeChange={setSelectedGrade}
                  showFeatured={showFeatured}
                  onFeaturedChange={setShowFeatured}
                  showActive={showActive}
                  onActiveChange={setShowActive}
                  onReset={resetFilters}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6"
            >
              <p className="font-semibold text-red-800">Unable to load artists</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => fetchArtists(1)}>
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-50">
                <span className="text-5xl">👤</span>
              </div>
              <h3 className="text-xl font-extrabold">No artists found</h3>
              <p className="mt-2 max-w-sm text-(--color-muted)">
                Try adjusting your search or filters to discover more artists.
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" className="mt-4" onClick={resetFilters}>
                  Clear All Filters
                </Button>
              )}
            </motion.div>
          ) : (
            /* Artists Grid */
            <>
              <motion.div
                layout
                className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}
              >
                <AnimatePresence mode="popLayout">
                  {items.map((artist) => (
                    <ArtistCard
                      key={artist._id}
                      artist={artist}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              <div className="mt-10">
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
              </div>
            </>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
