import { EventsGrid } from '@/components/events/EventsGrid';

export default function EventsPage() {
  return (
    <section className="bg-[var(--color-bg)]">
      <div className="lux-container py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight">Events</h1>
          <p className="mt-3 text-[var(--color-muted)]">Explore upcoming experiences and secure tickets in seconds.</p>
        </div>
        <div className="mt-10">
          <EventsGrid />
        </div>
      </div>
    </section>
  );
}
