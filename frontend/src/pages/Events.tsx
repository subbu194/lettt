import { motion } from 'framer-motion';
import { EventsGrid } from '@/components/events/EventsGrid';
import { PageTransition } from '@/components/shared/PageTransition';
import { fadeInUp } from '@/utils/animations';

export default function EventsPage() {
  return (
    <PageTransition>
      <section className="bg-[var(--color-bg)]">
        <div className="lux-container py-16">
          <motion.div
            className="max-w-3xl"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight">Events</h1>
            <p className="mt-3 text-[var(--color-muted)]">Explore upcoming experiences and secure tickets in seconds.</p>
          </motion.div>
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <EventsGrid />
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
