import { motion } from 'framer-motion';
import { PageTransition } from '@/components/shared/PageTransition';
import { fadeInUp } from '@/utils/animations';

export default function CatalogPage() {
  return (
    <PageTransition>
      <section className="bg-(--color-background)">
        {/* Hero */}
        <div className="relative overflow-hidden bg-(--color-soft-black) py-20 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-red-600/20 blur-[120px]" />
          <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-red-600/10 blur-[100px]" />
          <div className="lux-container relative">
            <motion.div
              className="max-w-3xl"
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
                Catalog
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
                Explore our <span className="text-gradient-red">Catalog</span>
              </h1>
              <p className="mt-3 text-white/60">
                This is a dummy page for now. We’ll add catalog content here soon.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="lux-container py-16">
          <div className="rounded-2xl border border-black/4 bg-white p-8 shadow-sm">
            <p className="text-lg font-semibold text-(--color-soft-black)">Catalog (Coming soon)</p>
            <p className="mt-2 text-sm text-(--color-muted)">
              Placeholder content. Add products/art/events categories here later.
            </p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

