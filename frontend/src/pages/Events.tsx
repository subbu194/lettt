import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Users, Ticket, X } from 'lucide-react';
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

interface EventItem {
  _id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  venue?: string;
  ticketPrice: number;
  coverImage?: string;
  galleryImages?: string[];
  seatsAvailable?: number;
  seatsLeft?: number;
  featured?: boolean;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface EventsResponse {
  items: EventItem[];
  pagination: PaginationData;
}

interface VenuesResponse {
  venues: string[];
}

// ─────────────────────────────────────────────────────────────
// Event Card Component
// ─────────────────────────────────────────────────────────────

function EventCard({ event }: { event: EventItem }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate >= new Date();
  const seatsLeft = event.seatsLeft ?? event.seatsAvailable ?? 0;
  const lowSeats = seatsLeft > 0 && seatsLeft <= 10;
  const soldOut = seatsLeft <= 0;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-(--color-primary-red)/20 to-(--color-primary-gold)/20">
          {event.coverImage ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-black/5 to-black/10" />
              )}
              <motion.img
                src={event.coverImage}
                alt={event.title}
                className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Calendar className="h-16 w-16 text-(--color-primary-red)/30" />
            </div>
          )}

          {/* Date Badge */}
          <div className="absolute left-4 top-4 rounded-xl bg-white/95 p-3 text-center shadow-lg backdrop-blur-sm">
            <span className="block text-2xl font-extrabold text-(--color-primary-red)">
              {eventDate.getDate()}
            </span>
            <span className="block text-xs font-semibold uppercase text-(--color-muted)">
              {eventDate.toLocaleDateString('en-US', { month: 'short' })}
            </span>
          </div>

          {/* Status Badges */}
          <div className="absolute right-4 top-4 flex flex-col gap-2">
            {event.featured && (
              <span className="rounded-full bg-(--color-primary-gold) px-3 py-1 text-xs font-bold text-(--color-primary-red) shadow-md">
                Featured
              </span>
            )}
            {!isUpcoming && (
              <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white shadow-md">
                Past Event
              </span>
            )}
            {isUpcoming && soldOut && (
              <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white shadow-md">
                Sold Out
              </span>
            )}
            {isUpcoming && lowSeats && !soldOut && (
              <span className="rounded-full bg-(--color-primary-red) px-3 py-1 text-xs font-bold text-white shadow-md">
                Only {seatsLeft} left!
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <Link to={`/events/${event._id}`}>
            <h3 className="text-xl font-extrabold tracking-tight transition-colors hover:text-(--color-primary-red) line-clamp-2">
              {event.title}
            </h3>
          </Link>

          {/* Event Meta */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-(--color-muted)">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{formatDate(eventDate)}</span>
              {event.time && (
                <>
                  <Clock className="ml-2 h-4 w-4 shrink-0" />
                  <span>{event.time}</span>
                </>
              )}
            </div>
            {event.venue && (
              <div className="flex items-center gap-2 text-sm text-(--color-muted)">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            )}
            {isUpcoming && seatsLeft > 0 && (
              <div className="flex items-center gap-2 text-sm text-(--color-muted)">
                <Users className="h-4 w-4 shrink-0" />
                <span>{seatsLeft} seats available</span>
              </div>
            )}
          </div>

          {/* Price and Action */}
          <div className="mt-5 flex items-center justify-between">
            <div>
              <span className="text-2xl font-extrabold text-(--color-primary-red)">
                ₹{event.ticketPrice.toLocaleString('en-IN')}
              </span>
              <span className="ml-1 text-sm text-(--color-muted)">/ ticket</span>
            </div>
            <Link to={`/events/${event._id}`}>
              <Button
                variant="gold"
                size="sm"
                disabled={!isUpcoming || soldOut}
              >
                <Ticket className="h-4 w-4" />
                {soldOut ? 'Sold Out' : 'Book Now'}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter Panel Component
// ─────────────────────────────────────────────────────────────

interface FilterPanelProps {
  venues: string[];
  selectedVenue: string;
  onVenueChange: (venue: string) => void;
  priceRange: { min: string; max: string };
  onPriceChange: (range: { min: string; max: string }) => void;
  showFeatured: boolean;
  onFeaturedChange: (val: boolean) => void;
  showUpcoming: boolean;
  onUpcomingChange: (val: boolean) => void;
  showAvailable: boolean;
  onAvailableChange: (val: boolean) => void;
  onReset: () => void;
}

function FilterPanel({
  venues,
  selectedVenue,
  onVenueChange,
  priceRange,
  onPriceChange,
  showFeatured,
  onFeaturedChange,
  showUpcoming,
  onUpcomingChange,
  showAvailable,
  onAvailableChange,
  onReset,
}: FilterPanelProps) {
  const hasFilters = selectedVenue || priceRange.min || priceRange.max || showFeatured || showUpcoming || showAvailable;

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
          {/* Venue Filter */}
          <div className="min-w-[160px]">
            <label className="mb-2 block text-sm font-semibold text-(--color-muted)">Venue</label>
            <select
              value={selectedVenue}
              onChange={(e) => onVenueChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm focus:border-(--color-primary-gold) focus:outline-none focus:ring-2 focus:ring-(--color-primary-gold)/20"
            >
              <option value="">All Venues</option>
              {venues.map((venue) => (
                <option key={venue} value={venue}>
                  {venue}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="min-w-[200px]">
            <label className="mb-2 block text-sm font-semibold text-(--color-muted)">Ticket Price (₹)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => onPriceChange({ ...priceRange, min: e.target.value })}
                className="h-11 w-24 rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-(--color-primary-gold) focus:outline-none focus:ring-2 focus:ring-(--color-primary-gold)/20"
              />
              <span className="flex items-center text-(--color-muted)">–</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => onPriceChange({ ...priceRange, max: e.target.value })}
                className="h-11 w-24 rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-(--color-primary-gold) focus:outline-none focus:ring-2 focus:ring-(--color-primary-gold)/20"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col gap-3">
            <label className="mb-1 block text-sm font-semibold text-(--color-muted)">Quick Filters</label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showFeatured}
                onChange={(e) => onFeaturedChange(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 text-(--color-primary-red) focus:ring-(--color-primary-gold)"
              />
              <span className="text-sm">Featured Events</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showUpcoming}
                onChange={(e) => onUpcomingChange(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 text-(--color-primary-red) focus:ring-(--color-primary-gold)"
              />
              <span className="text-sm">Upcoming Only</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showAvailable}
                onChange={(e) => onAvailableChange(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 text-(--color-primary-red) focus:ring-(--color-primary-gold)"
              />
              <span className="text-sm">Has Available Seats</span>
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
        Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, total)} of {total} events
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
            {start > 2 && <span className="px-1 text-(--color-muted)">...</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm transition-colors ${
              p === page
                ? 'border-(--color-primary-red) bg-(--color-primary-red) font-bold text-white'
                : 'border-black/10 bg-white hover:border-black/20'
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
// Main Events Page Component
// ─────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFeatured, setShowFeatured] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showAvailable, setShowAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Fetch venues on mount
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const resp = await apiClient.get<VenuesResponse>('/events/venues');
        setVenues(resp.data?.venues || []);
      } catch {
        // Ignore - venues are optional
      }
    };
    fetchVenues();
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '9');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedVenue) params.set('venue', selectedVenue);
      if (priceRange.min) params.set('minPrice', priceRange.min);
      if (priceRange.max) params.set('maxPrice', priceRange.max);
      if (showFeatured) params.set('featured', 'true');
      if (showUpcoming) params.set('upcoming', 'true');
      if (showAvailable) params.set('hasSeats', 'true');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const resp = await apiClient.get<EventsResponse>(`/events?${params.toString()}`);
      setItems(resp.data?.items || []);
      setPagination(resp.data?.pagination || pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedVenue, priceRange, showFeatured, showUpcoming, showAvailable, sortBy, sortOrder]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  const handlePageChange = (newPage: number) => {
    fetchEvents(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSelectedVenue('');
    setPriceRange({ min: '', max: '' });
    setShowFeatured(false);
    setShowUpcoming(true);
    setShowAvailable(false);
    setSearchQuery('');
  };

  const activeFiltersCount = [
    selectedVenue,
    priceRange.min,
    priceRange.max,
    showFeatured,
    showAvailable,
    !showUpcoming, // Count if upcoming is unchecked (not default)
  ].filter(Boolean).length;

  return (
    <PageTransition>
      <section className="min-h-screen bg-(--color-bg)">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-(--color-primary-red) to-[#8B2E2F] py-16 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-(--color-primary-gold) blur-3xl" />
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
                Upcoming <span className="text-(--color-primary-gold)">Events</span>
              </h1>
              <p className="mt-4 text-lg text-white/80">
                Discover amazing talent showcases, art exhibitions, and cultural events. Book your tickets now!
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
                placeholder="Search events, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-black/10 bg-white pl-12 pr-4 text-sm transition-all focus:border-(--color-primary-gold) focus:outline-none focus:ring-2 focus:ring-(--color-primary-gold)/20"
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
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-(--color-primary-gold) text-xs font-bold text-(--color-primary-red)">
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
                className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-(--color-primary-gold) focus:outline-none"
              >
                <option value="date-asc">Date: Soonest First</option>
                <option value="date-desc">Date: Latest First</option>
                <option value="ticketPrice-asc">Price: Low to High</option>
                <option value="ticketPrice-desc">Price: High to Low</option>
                <option value="title-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <div className="mb-6">
                <FilterPanel
                  venues={venues}
                  selectedVenue={selectedVenue}
                  onVenueChange={setSelectedVenue}
                  priceRange={priceRange}
                  onPriceChange={setPriceRange}
                  showFeatured={showFeatured}
                  onFeaturedChange={setShowFeatured}
                  showUpcoming={showUpcoming}
                  onUpcomingChange={setShowUpcoming}
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
              <p className="font-semibold text-red-800">Unable to load events</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => fetchEvents(1)}>
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
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
                <Calendar className="h-12 w-12 text-(--color-primary-red)/50" />
              </div>
              <h3 className="text-xl font-extrabold">No events found</h3>
              <p className="mt-2 max-w-sm text-(--color-muted)">
                Try adjusting your search or filters to discover more events.
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" className="mt-4" onClick={resetFilters}>
                  Clear All Filters
                </Button>
              )}
            </motion.div>
          ) : (
            /* Events Grid */
            <>
              <motion.div
                layout
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                <AnimatePresence mode="popLayout">
                  {items.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
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
