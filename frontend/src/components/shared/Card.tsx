import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className = '', hover = true }: Props) {
  return (
    <motion.div
      className={`rounded-2xl border border-black/10 bg-white shadow-sm text-(--color-text) ${className}`}
      whileHover={hover ? { y: -4, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

