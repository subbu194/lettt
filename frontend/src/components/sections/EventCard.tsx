import Atropos from 'atropos/react';
import { useEffect } from 'react';
import type { Event } from '../../types';
import { useMedia } from '../../hooks/useMedia';
import { Button } from '../ui/Button';
import { useState } from 'react';

function Banner({ src, name }: { src?: string; name: string }) {
  const [ok, setOk] = useState(true);
  if (src && ok) {
    return (
      <img
        src={src}
        alt={`${name} banner`}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setOk(false)}
      />
    );
  }
  return (
    <div
      className="h-full w-full bg-[radial-gradient(900px_450px_at_20%_20%,rgba(255,0,0,0.28),transparent_55%),radial-gradient(700px_500px_at_80%_60%,rgba(255,215,0,0.16),transparent_55%),linear-gradient(140deg,#050505,#140000,#050505)]"
      role="img"
      aria-label={`${name} banner placeholder`}
    />
  );
}

export function EventCard({ event }: { event: Event }) {
  const { enable3D } = useMedia();

  const card = (
    <article className="event-card glass luxe-glow rounded-2xl overflow-hidden">
      <div className="aspect-16/10 overflow-hidden">
        <Banner src={event.bannerWebp} name={event.name} />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold tracking-tight">{event.name}</h3>
        <div className="mt-2 text-sm text-white/65">
          <div>{new Date(event.dateISO).toLocaleDateString()}</div>
          <div>{event.venue}</div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-white/70">From </span>
            <span className="text-fg font-semibold">
              {event.currency} {event.price.toFixed(0)}
            </span>
          </div>
          <Button
            variant="accent"
            className="shadow-[0_0_0_1px_rgba(255,215,0,0.18),0_0_24px_rgba(255,0,0,0.18)] hover:shadow-[0_0_0_1px_rgba(255,215,0,0.28),0_0_30px_rgba(255,215,0,0.16)]"
          >
            Buy Tickets
          </Button>
        </div>
      </div>
    </article>
  );

  if (!enable3D) return card;
  useEffect(() => {
    // Only load Atropos CSS when 3D is enabled (desktop). Prevents mobile touch-action rules
    // from being injected unnecessarily.
    import('atropos/atropos.css');
  }, [enable3D]);

  return (
    <Atropos
      className="w-full"
      highlight={false}
      shadow={false}
      rotateXMax={10}
      rotateYMax={10}
      duration={240}
    >
      {card}
    </Atropos>
  );
}


