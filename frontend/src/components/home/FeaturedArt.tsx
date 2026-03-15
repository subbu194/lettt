import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Palette } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';

type ArtLike = Record<string, unknown>;

export function FeaturedArt() {
  const [items, setItems] = useState<ArtLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArt = async () => {
      try {
        const resp = await apiClient.get<{ items: ArtLike[] }>('/art/featured');
        setItems(resp.data?.items || []);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchArt();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('featured-art-scroll');
    if (container) {
      const scrollAmount = 360;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative bg-white section-padding overflow-hidden">
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="lux-container">
        <div className="fade-in flex items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-(--color-red) mb-4">
              Online Art Platform
            </span>
            <h2 className="heading-md text-(--color-soft-black)">Featured Art</h2>
            <p className="mt-2 text-sm text-(--color-muted) max-w-md">Your art doesn't just stay on a wall — it reaches homes, offices, and hearts everywhere</p>
          </div>

          <div className="flex items-center gap-2">
            {!loading && !error && items.length > 3 && (
              <div className="hidden gap-2 md:flex mr-3">
                <button
                  onClick={() => scroll('left')}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/6 bg-white hover:bg-gray-50 hover:border-black/10 transition-all shadow-xs"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/6 bg-white hover:bg-gray-50 hover:border-black/10 transition-all shadow-xs"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            <Link to="/art" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-(--color-red) hover:underline group">
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex gap-5 overflow-x-auto pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[260px] rounded-2xl bg-white border border-black/4 shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
                  <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl bg-red-50 border border-red-100 p-6 text-sm text-red-600">{error}</div>
        ) : (
          <div
            id="featured-art-scroll"
            className="mt-8 flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-1 px-1"
          >
            {items.map((art, i) => {
              const id = String(art._id ?? art.id ?? i);
              const title = String(art.title ?? 'Untitled');
              const price = Number(art.price ?? 0);
              const image = Array.isArray(art.images) && art.images.length ? String(art.images[0]) : undefined;
              const artist = String(art.artist ?? '');

              return (
                <Link
                  key={id}
                  to={`/art/${id}`}
                  className="group min-w-[260px] max-w-[260px] snap-start rounded-2xl bg-white border border-black/4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gray-50">
                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-linear-to-br from-red-50 to-gray-50">
                        <Palette className="h-12 w-12 text-red-200" />
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-sm font-bold flex items-center gap-1">
                        View Art <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-bold tracking-tight line-clamp-1 text-(--color-soft-black)" title={title}>{title}</h3>
                    {artist && (
                      <p className="mt-1 text-xs text-(--color-muted)">by {artist}</p>
                    )}
                    <div className="mt-3 pt-3 border-t border-black/4">
                      <span className="text-lg font-extrabold text-(--color-red)">₹{price.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <Link to="/art" className="mt-6 flex sm:hidden items-center justify-center gap-1.5 text-sm font-semibold text-(--color-red)">
          View All Art <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
