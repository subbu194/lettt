import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { SkeletonCard } from '@/components/shared/Skeleton';

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
      const scrollAmount = 350;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="featured-events" className="border-t border-black/10 bg-(--color-bg)">
      <div className="w-full px-4 py-12 sm:px-6">
        <div className="fade-in flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Featured Events</h2>
            <p className="mt-1 text-sm text-(--color-muted)">Curated experiences with unforgettable talent</p>
          </div>
          
          {!loading && !error && events.length > 3 && (
            <div className="hidden gap-2 md:flex">
              <button
                onClick={() => scroll('left')}
                className="rounded-full border border-black/10 bg-white p-2 hover:bg-gray-50 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scroll('right')}
                className="rounded-full border border-black/10 bg-white p-2 hover:bg-gray-50 transition"
                aria-label="Scroll right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[240px] h-[280px] rounded-lg bg-white border border-black/5 shadow-sm animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-t-lg" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">Error: {error}</div>
        ) : !events.length ? (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">
            No events available yet.
          </div>
        ) : (
          <div 
            id="featured-events-scroll"
            className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {events.map((event, idx) => {
              const id = String(event._id ?? event.id ?? idx);
              const title = String(event.title ?? event.name ?? 'Event');
              const venue = String(event.venue ?? '');
              const date = event.date ? new Date(String(event.date)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
              const price = Number(event.ticketPrice ?? 0);
              const image = typeof event.coverImage === 'string' ? event.coverImage : (typeof event.image === 'string' ? event.image : undefined);
              
              return (
                <Link 
                  key={id} 
                  to={`/events/${id}`}
                  className="group min-w-[240px] max-w-[240px] snap-start rounded-lg border border-black/5 bg-white shadow-sm transition-all hover:shadow-md hover:border-black/10"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-100">
                    {image ? (
                      <img 
                        src={image} 
                        alt={title} 
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">🎭</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold tracking-tight line-clamp-2 leading-snug" title={title}>{title}</h3>
                    <div className="mt-2 space-y-1">
                      {venue && (
                        <div className="flex items-center gap-1.5 text-xs text-black/60">
                          <MapPin size={11} className="shrink-0" />
                          <span className="line-clamp-1">{venue}</span>
                        </div>
                      )}
                      {date && (
                        <div className="flex items-center gap-1.5 text-xs text-black/60">
                          <Calendar size={11} className="shrink-0" />
                          <span>{date}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-(--color-primary-red)">₹{price.toLocaleString('en-IN')}</span>
                      <span className="text-xs font-semibold text-(--color-primary-red) opacity-0 transition-opacity group-hover:opacity-100">View →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

