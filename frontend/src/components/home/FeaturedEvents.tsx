import { EventsGrid } from '@/components/events/EventsGrid';

export function FeaturedEvents() {
  return (
    <section id="featured-events" className="border-t border-black/10 bg-[var(--color-bg)]">
      <div className="lux-container py-16">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div className="fade-in">
            <h2 className="text-3xl font-extrabold tracking-tight">Featured Events</h2>
            <p className="mt-2 text-[var(--color-muted)]">Curated experiences with    production and unforgettable talent.</p>
          </div>
        </div>

        <div className="mt-10 fade-in">
          <EventsGrid />
        </div>
      </div>
    </section>
  );
}

