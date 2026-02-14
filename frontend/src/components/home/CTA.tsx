import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  const navigate = useNavigate();

  return (
    <section id="cta" className="relative overflow-hidden bg-(--color-soft-black)">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-red-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-red-600/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-red-600/5 blur-3xl" />
      </div>

      <div className="lux-container relative section-padding">
        <div className="mx-auto max-w-3xl text-center fade-in">
          <motion.span
            className="inline-flex items-center gap-2 rounded-full bg-white/6 border border-white/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/60 mb-8"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Join Us
          </motion.span>

          <motion.h2
            className="heading-lg text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Join the community where{' '}
            <span className="text-gradient-red">talent rises</span>.
          </motion.h2>

          <motion.p
            className="mt-5 text-lg text-white/50 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Create an account to access art drops, event purchases, and exclusive content.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => navigate('/auth')}
              className="group inline-flex items-center gap-2 rounded-xl bg-(--color-red) px-8 py-4 text-base font-bold text-white shadow-lg shadow-red-600/25 hover:shadow-red-600/40 hover:bg-red-700 transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/events')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-8 py-4 text-base font-bold text-white hover:bg-white/8 hover:border-white/20 transition-all duration-300"
            >
              Browse Events
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

