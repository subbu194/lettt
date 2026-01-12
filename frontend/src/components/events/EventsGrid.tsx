import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { EventCard } from '@/components/events/EventCard';
import { SkeletonCard } from '@/components/shared/Skeleton';
import { staggerContainer, staggerItem } from '@/utils/animations';

type EventLike = Record<string, unknown>;

export function EventsGrid() {
  const [events, setEvents] = useState<EventLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const resp = await apiClient.get<EventLike[]>('/events');
        setEvents(resp.data || []);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Error: {error}
      </motion.div>
    );
  }

  if (!events.length) {
    return (
      <motion.div
        className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        No events available yet. Please check back soon.
      </motion.div>
    );
  }

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {events.map((event, idx) => {
        const rawId = event.id ?? event._id ?? event.slug ?? event.name;
        const key = rawId ? String(rawId) : `event-${idx}`;
        return (
          <motion.div key={key} variants={staggerItem}>
            <EventCard event={event} fallbackId={key} />
          </motion.div>
        );
      })}
    </motion.div>
  );
}

