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
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-(--color-primary-red) text-white shadow-2xl transition-shadow hover:shadow-[0_0_30px_rgba(207,70,71,0.6)]"
        aria-label="Open cart"
        type="button"
      >
        <ShoppingCart className="h-7 w-7" />
        <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-(--color-primary-gold) text-xs font-bold text-(--color-primary-red) ring-2 ring-white">
          {cartCount}
        </span>
      </motion.button>
    </AnimatePresence>
  );
}
