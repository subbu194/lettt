import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-3xl rounded-2xl border border-black/10 bg-[var(--color-bg)] text-[var(--color-text)] shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
          <div className="min-w-0">
            {title ? (
              <h2 id={titleId} className="truncate text-lg font-semibold tracking-tight">
                {title}
              </h2>
            ) : null}
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white hover:border-black/20"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

