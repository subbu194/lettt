import Particles, { initParticlesEngine } from '@tsparticles/react';
import type { ISourceOptions } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { useEffect, useMemo, useState } from 'react';
import { useMedia } from '../../hooks/useMedia';

/**
 * Custom Attract and Bounce Modes:
 * - "attract": Particles get pulled towards a circle area (not a single point).
 * - "bounce": Particles bounce off a circle area (not just the very center).
 * This is achieved with the 'attract' and 'bounce' sub-options 'type: "circle"'.
 * The default is "point". By using "circle", both effects stay round and don't only happen on the middle of the mouse.
 */

export function HeroParticles() {
  const [ready, setReady] = useState(false);
  const { isMobile, reduceMotion, lowEnd } = useMedia();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options = useMemo<ISourceOptions>(() => ({
    background: { color: { value: 'transparent' } },
    fullScreen: { enable: false },
    fpsLimit: reduceMotion ? 60 : 120,

    interactivity: {
      events: {
        onHover: {
          enable: !reduceMotion,
          mode: ['attract', 'bounce'],
        },
        resize: { enable: true },
      },
      modes: {
        attract: {
          distance: 120,
          duration: 0.35,
          speed: 1.2,
          // Make attract interaction round instead of centered on mouse
          type: 'circle'
        },
        bounce: {
          distance: 140,
          // Make bounce around a circle area, not just the exact pointer
          type: 'circle'
        },
      },
    },

    particles: {
      number: {
        value: lowEnd || isMobile ? 70 : 130,
        density: { enable: true },
      },

      color: { value: ['#FF0000', '#FFD700'] },

      opacity: {
        value: { min: 0.25, max: 0.55 },
      },

      size: {
        value: { min: 3, max: 6 },
      },

      move: {
        enable: true,
        speed: 0.9,
        outModes: {
          default: 'bounce',
        },
      },

      collisions: {
        enable: true,
        mode: 'bounce',
      },

      links: {
        enable: true,
        distance: 130,
        opacity: 0.1,
      },
    },

    detectRetina: true,
  }), [isMobile, lowEnd, reduceMotion]);

  if (!ready) return null;

  return (
    <div className="absolute inset-0">
      <Particles id="heroParticles" options={options} className="w-full h-full" />
    </div>
  );
}
