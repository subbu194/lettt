import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useUIStore } from '@/store/useUIStore';
import { Cart } from '@/components/purchase/Cart';

// Floating cart button for art purchases only
// Events use direct checkout flow from EventDetail page
export function FloatingCart() {
  const items = useCartStore((s) => s.items);
  const openModal = useUIStore((s) => s.openModal);
  const cartCount = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items]);

  // Don't show if cart is empty (art items only)
  if (cartCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => openModal(<Cart />)}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-red) text-white shadow-xl shadow-red-600/30 hover:shadow-red-600/50 transition-all animate-glow-pulse"
        aria-label="Open cart"
        type="button"
      >
        <ShoppingCart className="h-6 w-6" />
        <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-extrabold text-(--color-red) shadow-md">
          {cartCount}
        </span>
      </motion.button>
    </AnimatePresence>
  );
}
