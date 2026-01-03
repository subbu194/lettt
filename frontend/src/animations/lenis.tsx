import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import Lenis from '@studio-freight/lenis';
import { ensureGsapPlugins, ScrollTrigger } from './gsap';
import { useUiStore } from '../store/useStore';

type LenisApi = {
  lenis: Lenis | null;
  scrollTo: (target: number | string | HTMLElement, opts?: { offset?: number }) => void;
};

const LenisContext = createContext<LenisApi | null>(null);

export function useLenis() {
  const ctx = useContext(LenisContext);
  if (!ctx) throw new Error('useLenis must be used within SmoothScrollProvider');
  return ctx;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);
  const setNavbarScrolled = useUiStore((s) => s.setNavbarScrolled);

  const api = useMemo<LenisApi>(
    () => ({
      lenis: lenisRef.current,
      scrollTo: (target, opts) => {
        lenisRef.current?.scrollTo(target, { offset: opts?.offset ?? 0, duration: 1.2, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
      },
    }),
    []
  );

  useEffect(() => {
    ensureGsapPlugins();

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.1,
    });
    lenisRef.current = lenis;

    const scroller = document.documentElement;

    ScrollTrigger.scrollerProxy(scroller, {
      scrollTop(value) {
        if (typeof value === 'number') {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      pinType: scroller.style.transform ? 'transform' : 'fixed',
    });

    ScrollTrigger.defaults({ scroller });
    lenis.on('scroll', ScrollTrigger.update);

    let lastScrolled = false;
    lenis.on('scroll', ({ scroll }: { scroll: number }) => {
      const next = scroll > 16;
      if (next !== lastScrolled) {
        lastScrolled = next;
        setNavbarScrolled(next);
      }
    });

    const raf = (time: number) => {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };
    rafRef.current = requestAnimationFrame(raf);

    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener('refresh', onRefresh);
    ScrollTrigger.refresh();

    return () => {
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      lenis.destroy();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lenisRef.current = null;
      setNavbarScrolled(false);
    };
  }, [setNavbarScrolled]);

  return <LenisContext.Provider value={api}>{children}</LenisContext.Provider>;
}


