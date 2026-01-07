import { useLayoutEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ensureGsapPlugins, gsap } from '../../animations/gsap';
import { useLenis } from '../../animations/lenis';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { HeroParticles } from './HeroParticles';
import { FloatingIcons } from '../ui/FloatingIcons';
import { useMedia } from '../../hooks/useMedia';

function splitWords(text: string) {
  return text.split(' ').map((w) => w.trim()).filter(Boolean);
}

export function HeroSection() {
  const rootRef = useRef<HTMLElement | null>(null);
  const { scrollTo } = useLenis();
  const { isMobile, reduceMotion } = useMedia();

  const headline = useMemo(() => splitWords('Let the Talent talks out loud.'), []);

  useLayoutEffect(() => {
    if (reduceMotion) return;
    ensureGsapPlugins();
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>('[data-hero-word]');
      gsap.fromTo(
        words,
        { y: 18, opacity: 0, filter: 'blur(6px)' },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: isMobile ? 0.7 : 0.95,
          ease: 'power3.out',
          stagger: isMobile ? 0.035 : 0.05,
          delay: 0.1,
        }
      );

      gsap.fromTo(
        '[data-hero-sub]',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.35 }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [isMobile, reduceMotion]);

  return (
    <section
      ref={rootRef}
      className="relative -mt-16 min-h-[calc(100vh+4rem)] pt-16 overflow-hidden luxe-gradient"
    >
      <HeroParticles />
      <FloatingIcons />
      <div className="absolute inset-0 bg-black/55" />

      <Container className="relative pt-28 sm:pt-32">
        <div className="max-w-3xl">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[0.95]">
            {headline.map((w) => (
              <span key={w} className="inline-block mr-3">
                <span data-hero-word className="inline-block">
                  {w}
                </span>
              </span>
            ))}
          </h1>

          <p data-hero-sub className="mt-6 text-base sm:text-lg text-white/75 max-w-2xl">
            A premium platform for exclusive events, cinematic talk shows, and a community built for talent that belongs
            in the spotlight.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/events">
              <Button variant="accent">Explore Events</Button>
            </Link>
            <Link to="/talk-show">
              <Button variant="outlineHighlight">Watch Talk Show</Button>
            </Link>
          </div>

          <button
            className="mt-12 inline-flex items-center gap-3 text-white/70 hover:text-fg transition"
            onClick={() => scrollTo('#about')}
            aria-label="Scroll to About section"
          >
            <span className="text-xs tracking-[0.28em] uppercase">Scroll</span>
            <span className="relative h-8 w-[2px] bg-white/15 overflow-hidden rounded">
              <span className="absolute left-0 top-0 h-3 w-full bg-highlight animate-[pulse_1.4s_ease-in-out_infinite]" />
            </span>
          </button>
        </div>
      </Container>
    </section>
  );
}


