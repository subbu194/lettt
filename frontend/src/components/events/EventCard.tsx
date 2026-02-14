import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Card } from '@/components/shared/Card';

type EventLike = Record<string, unknown>;

export function EventCard({ event, fallbackId }: { event: EventLike; fallbackId: string }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const id = String(event.id ?? event._id ?? event.slug ?? event.name ?? fallbackId);
  const name = String(event.name ?? event.title ?? 'Untitled Event');
  const venue = String(event.venue ?? event.location ?? 'Venue TBA');
  const date = String(event.date ?? event.startDate ?? 'Date TBA');
  const price = Number(event.price ?? event.ticketPrice ?? 0);
  const image = typeof event.image === 'string' ? event.image : typeof event.coverImage === 'string' ? event.coverImage : undefined;
  
  // Format date
  let formattedDate = date;
  try {
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      formattedDate = dateObj.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
    }
  } catch {
    // Use original date string
  }

  return (
    <Link to={`/events/${id}`} className="block group">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="aspect-video w-full bg-gray-50 relative overflow-hidden">
          {image ? (
            <>
              {!imageLoaded && (
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-black/5 via-black/10 to-black/5"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 0%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{ backgroundSize: '200% 100%' }}
                />
              )}
              <motion.img
                src={image}
                alt={name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                initial={{ opacity: 0 }}
                animate={imageLoaded ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                onLoad={() => setImageLoaded(true)}
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Calendar className="h-12 w-12 text-(--color-muted)" />
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <motion.div
                className="text-lg font-extrabold tracking-tight line-clamp-2 text-(--color-soft-black) group-hover:text-(--color-red) transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {name}
              </motion.div>
              <motion.div
                className="mt-2 text-sm text-(--color-soft-black)/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </div>
                {venue && venue !== 'Venue TBA' && (
                  <div className="mt-1 line-clamp-1">{venue}</div>
                )}
              </motion.div>
            </div>
            <motion.div
              className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-(--color-red)"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {price ? `₹${price.toLocaleString('en-IN')}` : 'Free'}
            </motion.div>
          </div>

          <motion.div
            className="mt-4 text-sm font-semibold text-(--color-red) group-hover:underline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            View Details & Book →
          </motion.div>
        </div>
      </Card>
    </Link>
  );
}
