import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useCartStore } from '@/store/useCartStore';

type EventLike = Record<string, unknown>;

export function EventCard({ event, fallbackId }: { event: EventLike; fallbackId: string }) {
  const addItem = useCartStore((s) => s.addItem);

  const id = String(event.id ?? event._id ?? event.slug ?? event.name ?? fallbackId);
  const name = String(event.name ?? event.title ?? 'Untitled Event');
  const venue = String(event.venue ?? event.location ?? 'Venue TBA');
  const date = String(event.date ?? event.startDate ?? 'Date TBA');
  const price = Number(event.price ?? event.ticketPrice ?? 0);
  const image = typeof event.image === 'string' ? event.image : undefined;

  return (
    <Card className="overflow-hidden">
      <div className="aspect-16-10 w-full bg-black/5">
        {image ? <img src={image} alt={name} className="h-full w-full object-cover" loading="lazy" /> : null}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-lg font-extrabold tracking-tight">{name}</div>
            <div className="mt-1 text-sm text-black/70">
              {date} · {venue}
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-1 text-sm font-semibold">
            {price ? `$${price.toFixed(2)}` : 'Free'}
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="red"
            className="w-full"
            onClick={() => addItem({ id, name, price: price || 0, image })}
          >
            Buy Tickets
          </Button>
        </div>
      </div>
    </Card>
  );
}

