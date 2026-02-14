import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = Omit<HTMLMotionProps<"button">, 'children'> & {
  children: ReactNode;
  variant?: 'red' | 'gold' | 'ghost' | 'danger' | 'success' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export function Button({ children, className = '', variant = 'red', size = 'md', loading = false, disabled, ...props }: Props) {
  const sizeClass =
    size === 'sm'
      ? 'h-10 px-4 text-sm rounded-xl'
      : size === 'lg'
        ? 'h-13 px-7 text-base rounded-xl'
        : 'h-11 px-5 text-sm rounded-xl';

  const base = `inline-flex items-center justify-center gap-2 font-semibold tracking-wide transition-all duration-300
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-red) focus-visible:ring-offset-2 focus-visible:ring-offset-white
    disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`;

  const variants: Record<string, string> = {
    red: 'bg-(--color-red) text-white shadow-md hover:shadow-lg hover:bg-red-700 active:bg-red-800',
    gold: 'bg-(--color-red) text-white shadow-md hover:shadow-lg hover:bg-red-700 active:bg-red-800',
    ghost: 'bg-white text-(--color-soft-black) border border-black/[0.08] hover:border-red-200 hover:text-(--color-red) hover:shadow-sm',
    danger: 'bg-(--color-red) text-white shadow-md hover:shadow-lg hover:bg-red-700',
    success: 'bg-(--color-green) text-white shadow-md hover:shadow-lg hover:bg-green-700',
    dark: 'bg-(--color-soft-black) text-white shadow-md hover:shadow-lg hover:bg-gray-800',
  };

  const variantClass = variants[variant] || variants.red;
  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={`${base} ${sizeClass} ${variantClass} ${className}`}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
}


