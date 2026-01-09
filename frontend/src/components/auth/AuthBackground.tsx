import { motion } from 'framer-motion';

export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-24 top-20 h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'var(--color-primary-red)', opacity: 0.18 }}
        animate={{ x: [0, 40, -10, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-24 top-10 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'var(--color-primary-gold)', opacity: 0.18 }}
        animate={{ x: [0, -30, 20, 0], y: [0, 25, -15, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 top-[55%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'var(--color-text)', opacity: 0.06 }}
        animate={{ scale: [1, 1.08, 1], rotate: [0, 6, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
