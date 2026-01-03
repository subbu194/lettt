import { useLayoutEffect, useRef } from 'react';
import { ensureGsapPlugins, gsap } from '../../animations/gsap';
import { Container } from '../ui/Container';
import { StatCounter } from './StatCounter';
import { useMedia } from '../../hooks/useMedia';

export function AboutSection() {
  const rootRef = useRef<HTMLElement | null>(null);
  const { isMobile, reduceMotion } = useMedia();

  useLayoutEffect(() => {
    if (reduceMotion) return;
    ensureGsapPlugins();
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.about-card',
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: isMobile ? 0.6 : 0.85,
          stagger: isMobile ? 0.08 : 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 75%' },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [isMobile, reduceMotion]);

  return (
    <section ref={rootRef} id="about" className="py-16 sm:py-24">
      <Container>
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">A platform built for premium moments.</h2>
          <p className="mt-4 text-white/70">
            Let the talent talk curates luxury experiences where art meets influence—events, talk shows, and a community designed to
            feel exclusive, cinematic, and effortless.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="about-card">
            <StatCounter label="Artists" value={3200} suffix="+" />
          </div>
          <div className="about-card">
            <StatCounter label="Events" value={140} suffix="+" />
          </div>
          <div className="about-card">
            <StatCounter label="Videos" value={860} suffix="+" />
          </div>
          <div className="about-card">
            <StatCounter label="Community Members" value={12000} suffix="+" />
          </div>
        </div>
      </Container>
    </section>
  );
}


