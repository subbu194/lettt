import { motion } from 'framer-motion';
import { AboutContent } from '@/components/about/AboutContent';
import { PageTransition } from '@/components/shared/PageTransition';
import { fadeInUp } from '@/utils/animations';

export default function AboutPage() {
  return (
    <PageTransition>
      <section className="bg-(--color-bg)">
        <div className="lux-container py-16">
          <motion.div
            className="max-w-3xl"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight">About Us</h1>
            <p className="mt-3 text-(--color-muted)">
              A premium platform designed to elevate art, spotlight talent, and connect a vibrant community.
            </p>
          </motion.div>
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
