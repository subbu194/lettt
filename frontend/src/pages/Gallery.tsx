import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { PageTransition } from '@/components/shared/PageTransition';
import { fadeInUp } from '@/utils/animations';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { useDebounce } from '@/hooks/useDebounce';

interface GalleryItem {
  _id: string;
  imageUrl: string;
  category: string;
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

export default function Gallery() {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(null);
  const debouncedSearch = useDebounce(searchQuery.trim(), 300);

  const fetchImages = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '24');
      if (selectedCategory) params.set('category', selectedCategory);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const resp = await apiClient.get<{ items: GalleryItem[]; pagination: PaginationData }>(
        `/gallery?${params.toString()}`
      );
      setImages(resp.data?.items || []);
      setPagination(resp.data?.pagination || null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, debouncedSearch]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resp = await apiClient.get<{ categories: string[] }>('/gallery/categories');
        setCategories(resp.data?.categories || []);
      } catch {
        // ignore
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchImages(1);
  }, [fetchImages]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-(--color-background)">
        {/* Hero */}
        <div className="relative overflow-hidden bg-(--color-soft-black) py-20 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-red-600/15 blur-[120px]" />
          <div className="lux-container relative">
            <motion.div
              className="max-w-3xl"
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">Gallery</span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
                Our <span className="text-gradient-red">Collection</span>
              </h1>
              <p className="mt-3 text-white/60">
                A curated collection of our finest art, events, and memorable moments
              </p>
            </motion.div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="border-b border-black/4 bg-white sticky top-18 z-20">
          <div className="lux-container py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by category..."
                  className="h-10 w-full rounded-lg border border-black/8 bg-gray-50 pl-9 pr-8 text-sm text-(--color-soft-black) placeholder:text-black/40 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-200"
                  >
                    <X className="h-3 w-3 text-black/40" />
                  </button>
                )}
              </div>

              {/* Category filters */}
              {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                      !selectedCategory
                        ? 'bg-(--color-red) text-white'
                        : 'border border-black/4 bg-white hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-(--color-red) text-white'
                          : 'border border-black/4 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="lux-container py-12">
          {loading ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-black/4 bg-white p-6 text-center text-sm text-(--color-muted)">
              Error: {error}
            </div>
          ) : images.length === 0 ? (
            <div className="rounded-2xl border border-black/4 bg-white p-16 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-bold text-(--color-text)">No images found</h3>
              <p className="mt-2 text-sm text-(--color-muted)">
                {searchQuery || selectedCategory
                  ? 'Try adjusting your filters or search term'
                  : 'Gallery images will appear here soon'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img, idx) => (
                  <motion.button
                    key={img._id}
                    type="button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-black/4 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 duration-300"
                    onClick={() => setLightboxImage(img)}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.category}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {img.category}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <button
                    onClick={() => fetchImages(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/6 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium text-(--color-muted)">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchImages(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/6 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
              onClick={() => setLightboxImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-h-[90vh] max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={lightboxImage.imageUrl}
                  alt={lightboxImage.category}
                  className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
                />
                <div className="absolute bottom-4 left-4">
                  <span className="rounded-lg bg-black/70 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                    {lightboxImage.category}
                  </span>
                </div>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
