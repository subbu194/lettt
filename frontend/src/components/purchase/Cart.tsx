import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useCartStore } from '@/store/useCartStore';
import { useUserStore } from '@/store/useUserStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const { items, removeItem, clearCart, setQty } = useCartStore();
  const { isAuthenticated } = useUserStore();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  const handleRemove = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      removeItem(id);
      setRemovingId(null);
    }, 200);
  };

  const handleCheckout = () => {
    onClose();
    if (!isAuthenticated) {
      navigate('/auth?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-(--color-bg) shadow-2xl sm:w-[440px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--color-primary-red)/10">
                  <ShoppingCart className="h-5 w-5 text-(--color-primary-red)" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Your Cart</h2>
                  <p className="text-sm text-(--color-muted)">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-black/5">
                    <ShoppingCart className="h-10 w-10 text-(--color-muted)" />
                  </div>
                  <h3 className="text-lg font-extrabold">Your cart is empty</h3>
                  <p className="mt-2 text-sm text-(--color-muted)">
                    Add artworks or event tickets to get started.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <Button variant="ghost" size="sm" onClick={() => { onClose(); navigate('/art'); }}>
                      Browse Art
                    </Button>
                    <Button variant="red" size="sm" onClick={() => { onClose(); navigate('/events'); }}>
                      View Events
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: removingId === item.id ? 0.5 : 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="p-4">
                          <div className="flex gap-4">
                            {/* Item Image */}
                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/5">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="h-8 w-8 text-(--color-muted)" />
                                </div>
                              )}
                            </div>

                            {/* Item Details */}
                            <div className="flex flex-1 flex-col">
                              <h4 className="font-bold leading-tight line-clamp-2">{item.name}</h4>
                              <p className="mt-1 text-sm font-semibold text-(--color-primary-red)">
                                ₹{item.price.toLocaleString('en-IN')}
                              </p>

                              {/* Quantity & Remove */}
                              <div className="mt-auto flex items-center justify-between pt-2">
                                <div className="flex items-center rounded-lg border border-black/10 bg-white">
                                  <button
                                    onClick={() => setQty(item.id, Math.max(1, item.qty - 1))}
                                    className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-black/5"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                                  <button
                                    onClick={() => setQty(item.id, item.qty + 1)}
                                    className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-black/5"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleRemove(item.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-(--color-muted) transition-colors hover:bg-(--color-primary-red)/10 hover:text-(--color-primary-red)"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Subtotal */}
                            <div className="flex flex-col items-end justify-between">
                              <span className="text-right text-sm font-extrabold">
                                ₹{(item.price * item.qty).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Clear Cart */}
                  {items.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-(--color-muted) transition-colors hover:text-(--color-primary-red)"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All Items
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-black/10 p-5">
                {/* Subtotal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-(--color-muted)">Subtotal</span>
                    <span className="font-semibold">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-(--color-muted)">Taxes & Fees</span>
                    <span className="font-semibold text-green-600">Included</span>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-black/5 p-4">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-extrabold text-(--color-primary-red)">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Auth Warning */}
                {!isAuthenticated && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-(--color-primary-gold)/20 p-3 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 text-(--color-primary-red)" />
                    <span>You'll need to sign in to complete checkout.</span>
                  </div>
                )}

                {/* Checkout Button */}
                <Button
                  variant="gold"
                  size="lg"
                  className="mt-4 w-full"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5" />
                </Button>

                {/* Continue Shopping */}
                <button
                  onClick={onClose}
                  className="mt-3 w-full text-center text-sm font-semibold text-(--color-muted) transition-colors hover:text-(--color-text)"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Keep the old Cart component for backward compatibility
export function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, clearCart, setQty } = useCartStore();
  const { isAuthenticated } = useUserStore();
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  if (!items.length) {
    return (
      <Card className="p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
            <ShoppingCart className="h-8 w-8 text-(--color-muted)" />
          </div>
        </div>
        <div className="text-lg font-extrabold tracking-tight">Your cart is empty</div>
        <p className="mt-2 text-sm text-(--color-muted)">
          Add artworks or event tickets to get started.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/art">
            <Button variant="ghost" size="sm">Browse Art</Button>
          </Link>
          <Link to="/events">
            <Button variant="red" size="sm">View Events</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-24 overflow-hidden rounded-xl bg-black/5">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-6 w-6 text-(--color-muted)" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-extrabold tracking-tight">{item.name}</div>
                <div className="mt-1 text-sm text-(--color-muted)">
                  ₹{item.price.toLocaleString('en-IN')} × {item.qty}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="flex items-center rounded-xl border border-black/10 bg-white">
                <button
                  onClick={() => setQty(item.id, Math.max(1, item.qty - 1))}
                  className="flex h-10 w-10 items-center justify-center hover:bg-black/5"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold">{item.qty}</span>
                <button
                  onClick={() => setQty(item.id, item.qty + 1)}
                  className="flex h-10 w-10 items-center justify-center hover:bg-black/5"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <span className="min-w-[80px] text-right font-extrabold">
                ₹{(item.price * item.qty).toLocaleString('en-IN')}
              </span>

              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-(--color-muted) hover:border-(--color-primary-red) hover:text-(--color-primary-red)"
                onClick={() => removeItem(item.id)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-wide text-(--color-muted)">Total</div>
          <div className="text-2xl font-extrabold tracking-tight text-(--color-primary-red)">
            ₹{total.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={clearCart}>
            <Trash2 className="h-4 w-4" />
            Clear Cart
          </Button>
          <Button 
            variant="gold" 
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/auth?redirect=/checkout');
              } else {
                navigate('/checkout');
              }
            }}
          >
            Proceed to Checkout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

