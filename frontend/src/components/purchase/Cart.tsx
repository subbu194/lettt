import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useCartStore } from '@/store/useCartStore';

export function Cart() {
  const { items, removeItem, clearCart, setQty } = useCartStore();
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  if (!items.length) {
    return (
      <Card className="p-6">
        <div className="text-lg font-extrabold tracking-tight">Your cart is empty</div>
        <p className="mt-2 text-sm text-black/70">Add tickets from Events to see them here.</p>
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
                {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <div className="truncate font-extrabold tracking-tight">{item.name}</div>
                <div className="mt-1 text-sm text-black/70">${item.price.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-black/70">Qty</span>
                <input
                  className="h-11 w-20 rounded-xl border border-black/10 bg-white px-3"
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) => setQty(item.id, Number(e.target.value))}
                />
              </label>

              <button
                className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold hover:border-black/20"
                onClick={() => removeItem(item.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          </div>
        </Card>
      ))}

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-wide text-black/70">Total</div>
          <div className="text-2xl font-extrabold tracking-tight">${total.toFixed(2)}</div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={clearCart}>
            Clear Cart
          </Button>
          <Button variant="red" onClick={() => alert('Checkout flow coming soon')}>
            Checkout
          </Button>
        </div>
      </Card>
    </div>
  );
}

