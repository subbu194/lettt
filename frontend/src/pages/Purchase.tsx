import { motion } from 'framer-motion';
import { Cart } from '@/components/purchase/Cart';
import { PageTransition } from '@/components/shared/PageTransition';
import { fadeInUp } from '@/utils/animations';

export default function PurchasePage() {
  return (
    <PageTransition>
      <section className="bg-(--color-background)">
        <div className="lux-container py-16">
          <motion.div
            className="max-w-3xl"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight">Purchase</h1>
            <p className="mt-3 text-(--color-muted)">Review your tickets and complete your purchase.</p>
          </motion.div>
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Cart />
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}

