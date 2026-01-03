import { useLayoutEffect, useRef } from 'react';
import { ensureGsapPlugins, gsap } from '../../animations/gsap';
import { useMedia } from '../../hooks/useMedia';

export function StatCounter({
  label,
  value,
  suffix = '',
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const { reduceMotion } = useMedia();

  useLayoutEffect(() => {
    if (reduceMotion) return;
    ensureGsapPlugins();
    const el = ref.current;
    if (!el) return;

    const obj = { n: 0 };
    const tween = gsap.to(obj, {
      n: value,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = Math.floor(obj.n).toLocaleString();
      },
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });

    return () => {
      // Kill only this counter's trigger (do not kill global triggers)
      tween.scrollTrigger?.kill(false);
      tween.kill();
    };
  }, [reduceMotion, value]);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-3xl sm:text-4xl font-semibold">
        <span ref={ref}>0</span>
        <span className="text-highlight">{suffix}</span>
      </div>
      <div className="mt-1 text-sm text-white/65">{label}</div>
    </div>
  );
}


