import { create } from 'zustand';

// Cart now ONLY handles art items
// Events use direct payment flow from EventDetail page
type CartItem = {
  id: string; // Format: "{artId}-{size}" for sized items, or just "{artId}" for non-sized
  artId: string; // The actual art item ID from the database
  name: string;
  price: number;
  qty: number;
  image?: string;
  size?: string; // The selected size (e.g., "Small (8x10in)")
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setQty: (id: string, qty: number) => void;
  updateItemQty: (id: string, qty: number) => void;
};

const STORAGE_KEY = 'Let the talent talk_cart';

// Clean up any legacy sessionStorage cart data
const legacySessionCart = sessionStorage.getItem(STORAGE_KEY);
if (legacySessionCart && !localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, legacySessionCart);
  sessionStorage.removeItem(STORAGE_KEY);
} else if (legacySessionCart) {
  sessionStorage.removeItem(STORAGE_KEY);
}

function loadInitial(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Filter out any event items from old cart data
    return (parsed as Record<string, unknown>[]).filter((item) => 
      !item.itemType || item.itemType === 'art'
    ) as CartItem[];
  } catch {
    return [];
  }
}

function persist(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function clearPersisted() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: loadInitial(),
  addItem: (item) => {
    const qtyToAdd = Math.max(1, item.qty ?? 1);
    const prev = get().items;
    // Find existing item with same id (which includes size in the id)
    const idx = prev.findIndex((x) => x.id === item.id);
    const next =
      idx >= 0
        ? prev.map((x, i) => (i === idx ? { ...x, qty: x.qty + qtyToAdd } : x))
        : [...prev, { ...item, qty: qtyToAdd }];
    persist(next);
    set({ items: next });
  },
  removeItem: (id) => {
    const next = get().items.filter((x) => x.id !== id);
    persist(next);
    set({ items: next });
  },
  clearCart: () => {
    clearPersisted();
    set({ items: [] });
  },
  setQty: (id, qty) => {
    const safe = Math.max(1, Math.floor(qty));
    const next = get().items.map((x) => (x.id === id ? { ...x, qty: safe } : x));
    persist(next);
    set({ items: next });
  },
  updateItemQty: (id, qty) => {
    const safe = Math.max(1, Math.floor(qty));
    const next = get().items.map((x) => (x.id === id ? { ...x, qty: safe } : x));
    persist(next);
    set({ items: next });
  },
}));


