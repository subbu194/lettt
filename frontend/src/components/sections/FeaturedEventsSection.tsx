import { useLayoutEffect, useMemo, useRef } from 'react';
import { ensureGsapPlugins, gsap } from '../../animations/gsap';
import type { Event } from '../../types';
import { Container } from '../ui/Container';
import { EventCard } from './EventCard';
import { useMedia } from '../../hooks/useMedia';

export function FeaturedEventsSection() {
  const rootRef = useRef<HTMLElement | null>(null);
  const { isMobile, reduceMotion } = useMedia();

  const events = useMemo<Event[]>(
    () => [
      {
        id: 'evt_1',
        name: 'Midnight Gallery Premiere',
        dateISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
        venue: 'The Black Hall, Downtown',
        price: 199,
        currency: 'USD',
        bannerWebp: '/images/events/midnight.webp',
      },
      {
        id: 'evt_2',
        name: 'Gold Frame Collector Night',
        dateISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28).toISOString(),
        venue: 'Atrium Lounge',
        price: 249,
        currency: 'USD',
        bannerWebp: '/images/events/collector.webp',
      },
      {
        id: 'evt_3',
        name: 'Red Carpet Talent Showcase',
        dateISO: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
        venue: 'Studio A',
        price: 149,
        currency: 'USD',
        bannerWebp: '/images/events/redcarpet.webp',
      },
    ],
    []
  );

  useLayoutEffect(() => {
    if (reduceMotion) return;
    ensureGsapPlugins();
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.event-card',
        { y: 22, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: isMobile ? 0.6 : 0.85,
          ease: 'power3.out',
          stagger: isMobile ? 0.08 : 0.12,
          scrollTrigger: { trigger: rootRef.current, start: 'top 75%' },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [isMobile, reduceMotion]);

  return (
    <section ref={rootRef} id="events" className="py-16 sm:py-24">
      <Container>
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Featured Events</h2>
            <p className="mt-3 text-white/70">
              Curated nights, private showcases, and premium experiences—crafted to feel unforgettable.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </Container>
    </section>
  );
}


