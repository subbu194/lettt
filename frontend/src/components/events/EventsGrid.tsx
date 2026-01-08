import { useEffect, useState } from 'react';
import { get } from '@/api/client';
import { EventCard } from '@/components/events/EventCard';

type EventLike = Record<string, unknown>;

export function EventsGrid() {
  const [events, setEvents] = useState<EventLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await get<EventLike[]>('/events');
      if (error) setError(error);
      else setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[320px] rounded-2xl border border-black/10 bg-white shadow-sm" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">Error: {error}</div>;
  }

  if (!events.length) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">
        No events available yet. Please check back soon.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event, idx) => {
        const rawId = event.id ?? event._id ?? event.slug ?? event.name;
        const key = rawId ? String(rawId) : `event-${idx}`;
        return <EventCard key={key} event={event} fallbackId={key} />;
      })}
    </div>
  );
}

