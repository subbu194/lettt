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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 200ms ease-out both' }} />
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white text-(--color-text) shadow-2xl border border-black/4"
        style={{ animation: 'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/4 px-6 py-4">
          <div className="min-w-0">
            {title ? (
              <h2 id={titleId} className="truncate text-lg font-bold tracking-tight">
                {title}
              </h2>
            ) : null}
          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-(--color-muted) hover:bg-gray-200 hover:text-(--color-soft-black) transition-all"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

