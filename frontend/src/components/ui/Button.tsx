import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'accent' | 'ghost' | 'outlineHighlight';
type Size = 'sm' | 'md';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({ variant = 'accent', size = 'md', className, ...props }: Props) {
  const base =
    'luxe-glow inline-flex items-center justify-center rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/80';

  const sizes: Record<Size, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-sm sm:text-base',
  };

  const variants: Record<Variant, string> = {
    accent: 'bg-accent text-fg hover:brightness-110 active:brightness-95',
    ghost: 'bg-white/5 text-fg hover:bg-white/10 border border-white/10',
    outlineHighlight: 'border border-highlight text-highlight hover:bg-highlight/10',
  };

  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className ?? ''}`} {...props} />;
}


