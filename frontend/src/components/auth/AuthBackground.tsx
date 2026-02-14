import { motion } from 'framer-motion';

export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-[0.02]" />
      <motion.div
        className="absolute -left-32 top-10 h-96 w-96 rounded-full blur-[120px]"
        style={{ background: 'var(--color-red)', opacity: 0.12 }}
        animate={{ x: [0, 40, -10, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-32 top-20 h-[28rem] w-[28rem] rounded-full blur-[140px]"
        style={{ background: 'var(--color-red)', opacity: 0.08 }}
        animate={{ x: [0, -30, 20, 0], y: [0, 25, -15, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 top-[60%] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: 'var(--color-soft-black)', opacity: 0.04 }}
        animate={{ scale: [1, 1.08, 1], rotate: [0, 6, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
