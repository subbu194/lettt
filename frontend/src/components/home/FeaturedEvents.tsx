import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, MapPin, ArrowRight } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';

type EventLike = Record<string, unknown>;

export function FeaturedEvents() {
  const [events, setEvents] = useState<EventLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const resp = await apiClient.get<{ items: EventLike[] }>('/events/featured');
        setEvents(resp.data?.items || []);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('featured-events-scroll');
    if (container) {
      const scrollAmount = 360;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="featured-events" className="relative bg-(--color-background) section-padding overflow-hidden">
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="lux-container">
        <div className="fade-in flex items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-(--color-red) mb-4">
              Featured
            </span>
            <h2 className="heading-md text-(--color-soft-black)">
              Upcoming Events
            </h2>
            <p className="mt-2 text-sm text-(--color-muted) max-w-md">Curated experiences with unforgettable talent</p>
          </div>

          <div className="flex items-center gap-2">
            {!loading && !error && events.length > 3 && (
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
            <Link to="/events" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-(--color-red) hover:underline group">
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex gap-5 overflow-x-auto pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-70 h-[340px] rounded-2xl bg-white border border-black/4 shadow-sm animate-pulse">
                <div className="h-44 bg-gray-100 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
                  <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
                  <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl bg-red-50 border border-red-100 p-6 text-sm text-red-600">{error}</div>
        ) : !events.length ? (
          <div className="mt-8 rounded-2xl bg-gray-50 border border-black/4 p-8 text-center text-sm text-(--color-muted)">
            No events available yet. Check back soon!
          </div>
        ) : (
          <div
            id="featured-events-scroll"
            className="mt-8 flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-1 px-1"
          >
            {events.map((event, idx) => {
              const id = String(event._id ?? event.id ?? idx);
              const title = String(event.title ?? event.name ?? 'Event');
              const venue = String(event.venue ?? '');
              const date = event.date ? new Date(String(event.date)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
              const price = Number(event.ticketPrice ?? 0);
              const image = typeof event.coverImage === 'string' ? event.coverImage : (typeof event.image === 'string' ? event.image : undefined);

              return (
                <Link
                  key={id}
                  to={`/events/${id}`}
                  className="group min-w-70 max-w-70 snap-start rounded-2xl bg-white border border-black/4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-44 overflow-hidden rounded-t-2xl bg-gray-100">
                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-linear-to-br from-red-50 to-gray-50">
                        <Calendar className="h-12 w-12 text-red-200" />
                      </div>
                    )}
                    {/* Date badge */}
                    {date && (
                      <div className="absolute top-3 left-3 rounded-xl bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-sm">
                        <span className="text-xs font-bold text-(--color-soft-black)">{date}</span>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-bold tracking-tight line-clamp-2 text-(--color-soft-black) group-hover:text-(--color-red) transition-colors" title={title}>
                      {title}
                    </h3>
                    {venue && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-(--color-muted)">
                        <MapPin size={12} className="shrink-0" />
                        <span className="line-clamp-1">{venue}</span>
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-black/4">
                      <span className="text-lg font-extrabold text-(--color-red)">₹{price.toLocaleString('en-IN')}</span>
                      <span className="text-xs font-bold text-(--color-red) flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-4px] group-hover:translate-x-0">
                        Book Now <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Mobile view all link */}
        <Link to="/events" className="mt-6 flex sm:hidden items-center justify-center gap-1.5 text-sm font-semibold text-(--color-red)">
          View All Events <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

