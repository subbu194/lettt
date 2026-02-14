import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
};

export function Card({ children, className = '', hover = true, glass = false }: Props) {
  return (
    <motion.div
      className={`rounded-2xl ${
        glass
          ? 'bg-white/60 backdrop-blur-xl border border-white/20'
          : 'bg-white border border-black/4'
      } shadow-sm text-(--color-soft-black) ${className}`}
      whileHover={hover ? { y: -4, boxShadow: '0 16px 48px -12px rgba(0, 0, 0, 0.12)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

