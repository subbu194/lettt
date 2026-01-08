import { ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/Button';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section id="hero" className="relative flex min-h-[calc(100vh-4rem)] items-center">
      <div className="lux-container py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-black/60">  ART & TALENT PLATFORM</p>
          <h1 className="mt-4 luckiest-guy-regular text-4xl tracking-tight sm:text-5xl md:text-6xl">
            <span className="animated-gradient-text">Elevate Art.</span> <span className="animated-gradient-text">Celebrate Talent.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-black/70 sm:text-lg">
            Discover exclusive events, cinematic talk shows, and a    community where talent rises.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="red" size="lg" onClick={() => navigate('/events')}>
              Explore Events
            </Button>
            <Button variant="gold" size="lg" onClick={() => navigate('/talkshow')}>
              Watch Talk Show
            </Button>
          </div>

          <button
            className="mx-auto mt-10 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black/70 hover:text-black"
            onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            aria-label="Scroll to About section"
            type="button"
          >
            <ArrowDown className="h-4 w-4" />
            Scroll
          </button>
        </div>
      </div>
    </section>
  );
}

