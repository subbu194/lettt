import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: Props) {
  return (
    <div className={`rounded-2xl border border-black/10 bg-white shadow-sm text-[var(--color-text)] ${className}`}>
      {children}
    </div>
  );
}

