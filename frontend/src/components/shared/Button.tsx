import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'red' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ children, className = '', variant = 'red', size = 'md', ...props }: Props) {
  const sizeClass =
    size === 'sm'
      ? 'h-10 px-4 text-sm'
      : size === 'lg'
        ? 'h-12 px-6 text-base'
        : 'h-11 px-5 text-sm';

  const base = `inline-flex min-h-11 items-center justify-center rounded-xl font-semibold tracking-wide transition
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-white
    disabled:opacity-60 disabled:cursor-not-allowed`;

  const variantClass =
    variant === 'gold'
      ? 'bg-[var(--color-primary-gold)] text-[var(--color-primary-red)] glow-red hover:glow-gold'
      : variant === 'ghost'
        ? 'bg-white text-black border border-black/15 hover:border-black/30'
        : 'bg-[var(--color-primary-red)] text-[var(--color-primary-gold)] glow-gold hover:glow-red';

  return (
    <button className={`${base} ${sizeClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

