import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight, Grid3X3, LayoutList, X, ShoppingCart } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { PageTransition } from '@/components/shared/PageTransition';
import { SkeletonCard } from '@/components/shared/Skeleton';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useCartStore } from '@/store/useCartStore';
import { useDebounce } from '@/hooks/useDebounce';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ArtItem {
  _id: string;
  title: string;
  description?: string;
  price: number;
  artist?: string;
  category?: string;
  images: string[];
  dimensions?: string;
  featured?: boolean;
  available?: boolean;
  isAvailable?: boolean;
  quantity?: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ArtResponse {
  items: ArtItem[];
  pagination: PaginationData;
}

interface CategoriesResponse {
  categories: string[];
}

// ─────────────────────────────────────────────────────────────
// Art Card Component
// ─────────────────────────────────────────────────────────────

function ArtCard({ art, onAddToCart }: { art: ArtItem; onAddToCart: () => void }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const image = art.images?.[0];
  const isSoldOut = (art.quantity !== undefined && art.quantity === 0) || art.available === false || art.isAvailable === false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      <Link to={`/art/${art._id}`}>
        <Card className="overflow-hidden transition-all hover:shadow-lg">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-black/5 to-black/10">
          {image ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-black/5 to-black/10" />
              )}
              <motion.img
                src={image}
                alt={art.title}
                className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl opacity-20">🎨</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {art.featured && (
              <span className="rounded-full bg-[var(--color-primary-gold)] px-3 py-1 text-xs font-bold text-[var(--color-primary-red)] shadow-md">
                Featured
              </span>
            )}
            {isSoldOut && (
              <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white shadow-md">
                Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {art.category && (
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              {art.category}
            </span>
          )}
          <h3 className="mt-1 text-lg font-extrabold tracking-tight line-clamp-1">{art.title}</h3>
          {art.artist && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">by {art.artist}</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xl font-extrabold text-[var(--color-primary-red)]">
              ₹{art.price.toLocaleString('en-IN')}
            </span>
            {art.dimensions && (
              <span className="text-xs text-[var(--color-muted)]">{art.dimensions}</span>
            )}
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
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  priceRange: { min: string; max: string };
  onPriceChange: (range: { min: string; max: string }) => void;
  showFeatured: boolean;
  onFeaturedChange: (val: boolean) => void;
  showAvailable: boolean;
  onAvailableChange: (val: boolean) => void;
  onReset: () => void;
}

function FilterPanel({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  showFeatured,
  onFeaturedChange,
  showAvailable,
  onAvailableChange,
  onReset,
}: FilterPanelProps) {
  const hasFilters = selectedCategory || priceRange.min || priceRange.max || showFeatured || showAvailable;

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
          {/* Category Filter */}
          <div className="min-w-[160px]">
            <label className="mb-2 block text-sm font-semibold text-[var(--color-muted)]">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm focus:border-[var(--color-primary-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]/20"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="min-w-[200px]">
            <label className="mb-2 block text-sm font-semibold text-[var(--color-muted)]">Price Range (₹)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => onPriceChange({ ...priceRange, min: e.target.value })}
                className="h-11 w-24 rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-[var(--color-primary-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]/20"
              />
              <span className="flex items-center text-[var(--color-muted)]">–</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => onPriceChange({ ...priceRange, max: e.target.value })}
                className="h-11 w-24 rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-[var(--color-primary-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]/20"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col gap-3">
            <label className="mb-2 block text-sm font-semibold text-[var(--color-muted)]">Quick Filters</label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showFeatured}
                onChange={(e) => onFeaturedChange(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 text-[var(--color-primary-red)] focus:ring-[var(--color-primary-gold)]"
              />
              <span className="text-sm">Featured Only</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showAvailable}
                onChange={(e) => onAvailableChange(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 text-[var(--color-primary-red)] focus:ring-[var(--color-primary-gold)]"
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
      <span className="text-sm text-[var(--color-muted)]">
        Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, total)} of {total} artworks
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-sm transition-colors hover:border-black/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {start > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-sm transition-colors hover:border-black/20"
            >
              1
            </button>
            {start > 2 && <span className="px-1 text-[var(--color-muted)]">...</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm transition-colors ${
              p === page
                ? 'border-[var(--color-primary-red)] bg-[var(--color-primary-red)] font-bold text-white'
                : 'border-black/10 bg-white hover:border-black/20'
            }`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-[var(--color-muted)]">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-sm transition-colors hover:border-black/20"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-sm transition-colors hover:border-black/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Art Page Component
// ─────────────────────────────────────────────────────────────

export default function ArtPage() {
  const [items, setItems] = useState<ArtItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFeatured, setShowFeatured] = useState(false);
  const [showAvailable, setShowAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Cart
  const addItem = useCartStore((s) => s.addItem);
  
  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resp = await apiClient.get<CategoriesResponse>('/art/categories');
        setCategories(resp.data?.categories || []);
      } catch {
        // Ignore - categories are optional
      }
    };
    fetchCategories();
  }, []);

  // Fetch art items
  const fetchArt = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategory) params.set('category', selectedCategory);
      if (priceRange.min) params.set('minPrice', priceRange.min);
      if (priceRange.max) params.set('maxPrice', priceRange.max);
      if (showFeatured) params.set('featured', 'true');
      if (showAvailable) params.set('available', 'true');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const resp = await apiClient.get<ArtResponse>(`/art?${params.toString()}`);
      setItems(resp.data?.items || []);
      setPagination(resp.data?.pagination || pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, priceRange, showFeatured, showAvailable, sortBy, sortOrder]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchArt(1);
  }, [fetchArt]);

  const handlePageChange = (newPage: number) => {
    fetchArt(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (art: ArtItem) => {
    addItem({
      id: art._id,
      name: art.title,
      price: art.price,
      image: art.images?.[0],
      itemType: 'art',
    });
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setShowFeatured(false);
    setShowAvailable(false);
    setSearchQuery('');
  };

  const activeFiltersCount = [
    selectedCategory,
    priceRange.min,
    priceRange.max,
    showFeatured,
    showAvailable,
  ].filter(Boolean).length;

  return (
    <PageTransition>
      <section className="min-h-screen bg-[var(--color-bg)]">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary-red)] to-[#8B2E2F] py-16 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-[var(--color-primary-gold)] blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-white blur-3xl" />
          </div>
          <div className="lux-container relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
                Art <span className="text-[var(--color-primary-gold)]">Gallery</span>
              </h1>
              <p className="mt-4 text-lg text-white/80">
                Discover extraordinary artworks from talented artists. Each piece tells a unique story.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="lux-container py-8">
          {/* Search & Controls Bar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                type="text"
                placeholder="Search artworks, artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-black/10 bg-white pl-12 pr-4 text-sm transition-all focus:border-[var(--color-primary-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]/20"
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
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-gold)] text-xs font-bold text-[var(--color-primary-red)]">
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
                className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-[var(--color-primary-gold)] focus:outline-none"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="title-asc">Name: A to Z</option>
                <option value="title-desc">Name: Z to A</option>
              </select>

              {/* View Mode Toggle */}
              <div className="hidden items-center gap-1 rounded-xl border border-black/10 bg-white p-1 sm:flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg p-2 transition-colors ${viewMode === 'grid' ? 'bg-[var(--color-primary-red)] text-white' : 'hover:bg-black/5'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg p-2 transition-colors ${viewMode === 'list' ? 'bg-[var(--color-primary-red)] text-white' : 'hover:bg-black/5'}`}
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
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  priceRange={priceRange}
                  onPriceChange={setPriceRange}
                  showFeatured={showFeatured}
                  onFeaturedChange={setShowFeatured}
                  showAvailable={showAvailable}
                  onAvailableChange={setShowAvailable}
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
              <p className="font-semibold text-red-800">Unable to load artworks</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => fetchArt(1)}>
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
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-black/5">
                <span className="text-5xl">🎨</span>
              </div>
              <h3 className="text-xl font-extrabold">No artworks found</h3>
              <p className="mt-2 max-w-sm text-[var(--color-muted)]">
                Try adjusting your search or filters to discover more artworks.
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" className="mt-4" onClick={resetFilters}>
                  Clear All Filters
                </Button>
              )}
            </motion.div>
          ) : (
            /* Art Grid */
            <>
              <motion.div
                layout
                className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}
              >
                <AnimatePresence mode="popLayout">
                  {items.map((art) => (
                    <ArtCard
                      key={art._id}
                      art={art}
                      onAddToCart={() => handleAddToCart(art)}
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
