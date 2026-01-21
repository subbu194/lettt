import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useCartStore } from '@/store/useCartStore';

type EventLike = Record<string, unknown>;

export function EventCard({ event, fallbackId }: { event: EventLike; fallbackId: string }) {
  const addItem = useCartStore((s) => s.addItem);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const id = String(event.id ?? event._id ?? event.slug ?? event.name ?? fallbackId);
  const name = String(event.name ?? event.title ?? 'Untitled Event');
  const venue = String(event.venue ?? event.location ?? 'Venue TBA');
  const date = String(event.date ?? event.startDate ?? 'Date TBA');
  const price = Number(event.price ?? event.ticketPrice ?? 0);
  const image = typeof event.image === 'string' ? event.image : undefined;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    addItem({ id, name, price: price || 0, image, itemType: 'event' });
    
    // Simulate a brief delay for feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    setAddingToCart(false);
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-16-10 w-full bg-black/5 relative overflow-hidden">
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
              className="h-full w-full object-cover"
              loading="lazy"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={imageLoaded ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <motion.div
              className="truncate text-lg font-extrabold tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {name}
            </motion.div>
            <motion.div
              className="mt-1 text-sm text-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {date} · {venue}
            </motion.div>
          </div>
          <motion.div
            className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-1 text-sm font-semibold"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {price ? `$${price.toFixed(2)}` : 'Free'}
          </motion.div>
        </div>

        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Button
            variant="red"
            className="w-full"
            onClick={handleAddToCart}
            loading={addingToCart}
          >
            {addingToCart ? 'Adding...' : 'Buy Tickets'}
          </Button>
        </motion.div>
      </div>
    </Card>
  );
}

