import { motion } from 'framer-motion';
import { PageTransition } from '@/components/shared/PageTransition';

export default function Gallery() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-(--color-background)">
        <div className="relative overflow-hidden bg-(--color-soft-black) py-20 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-red-600/15 blur-[120px]" />
          <div className="lux-container relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">Gallery</span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Coming <span className="text-gradient-red">Soon</span>
              </h1>
              <p className="mt-4 text-lg text-white/60">
                A curated collection of our finest art and moments
              </p>
            </motion.div>
          </div>
        </div>

        <div className="lux-container py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl border border-black/4 bg-white p-16 text-center shadow-sm"
          >
            <div className="mx-auto max-w-2xl">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
                <span className="text-4xl">🎨</span>
              </div>
              <h2 className="text-2xl font-extrabold text-(--color-text)">
                We're Building Something Special
              </h2>
              <p className="mt-4 text-(--color-muted) leading-relaxed">
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
