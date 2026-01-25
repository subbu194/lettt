import { motion } from 'framer-motion';
import { PageTransition } from '@/components/shared/PageTransition';

export default function Gallery() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-(--color-bg) py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-(--color-text) sm:text-5xl">
              Gallery
            </h1>
            <p className="mt-4 text-lg text-(--color-muted)">
              Coming Soon - A curated collection of our finest art and moments
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 rounded-2xl border border-black/10 bg-white p-12 text-center shadow-sm"
          >
            <div className="mx-auto max-w-2xl">
              <div className="mb-6 text-6xl">🎨</div>
              <h2 className="text-2xl font-bold text-(--color-text)">
                We're Building Something Special
              </h2>
              <p className="mt-4 text-(--color-muted)">
                Our gallery is being carefully curated to showcase the best artwork, 
                event photography, and memorable moments from Let The Talent Talk. 
                Check back soon to explore our visual journey!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
