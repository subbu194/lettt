import { useEffect } from 'react';

export function usePointerGlow() {
  useEffect(() => {
    let raf = 0;

    const setVars = (x: number, y: number) => {
      const root = document.documentElement;
      root.style.setProperty('--glow-x', `${x}px`);
      root.style.setProperty('--glow-y', `${y}px`);
    };

    const onMove = (e: PointerEvent) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setVars(e.clientX, e.clientY));
    };

    // Initialize to center so first hover still looks good.
    setVars(window.innerWidth / 2, window.innerHeight / 2);

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);
}


