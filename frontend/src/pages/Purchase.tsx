import { Cart } from '@/components/purchase/Cart';

export default function PurchasePage() {
  return (
    <section className="bg-[var(--color-bg)]">
      <div className="lux-container py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight">Purchase</h1>
          <p className="mt-3 text-[var(--color-muted)]">Review your tickets and complete your purchase.</p>
        </div>
        <div className="mt-10">
          <Cart />
        </div>
      </div>
    </section>
  );
}

