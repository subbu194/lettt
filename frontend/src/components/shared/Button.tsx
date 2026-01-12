import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'red' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export function Button({ children, className = '', variant = 'red', size = 'md', loading = false, disabled, ...props }: Props) {
  const sizeClass =
    size === 'sm'
      ? 'h-10 px-4 text-sm'
      : size === 'lg'
        ? 'h-12 px-6 text-base'
        : 'h-11 px-5 text-sm';

  const base = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-white
    disabled:opacity-60 disabled:cursor-not-allowed`;

  const variantClass =
    variant === 'gold'
      ? 'bg-[var(--color-primary-gold)] text-[var(--color-primary-red)] glow-red hover:glow-gold'
      : variant === 'ghost'
        ? 'bg-white text-black border border-black/15 hover:border-black/30'
        : 'bg-[var(--color-primary-red)] text-[var(--color-primary-gold)] glow-gold hover:glow-red';

  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={`${base} ${sizeClass} ${variantClass} ${className}`}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </motion.div>
      )}
      {children}
    </motion.button>
  );
}


