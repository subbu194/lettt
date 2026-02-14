import { motion } from 'framer-motion';
import { AboutContent } from '@/components/about/AboutContent';
import { PageTransition } from '@/components/shared/PageTransition';
import { fadeInUp } from '@/utils/animations';

export default function AboutPage() {
  return (
    <PageTransition>
      <section className="bg-(--color-background)">
        <div className="relative overflow-hidden bg-(--color-soft-black) py-20 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-red-600/15 blur-[120px]" />
          <div className="lux-container relative">
            <motion.div
              className="max-w-3xl"
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">About Us</span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Our <span className="text-gradient-red">Story</span></h1>
              <p className="mt-3 text-white/60">
                A premium platform designed to elevate art, spotlight talent, and connect a vibrant community.
              </p>
            </motion.div>
          </div>
        </div>
        <div className="lux-container py-16">
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <AboutContent />
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}
