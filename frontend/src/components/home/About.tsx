import { useEffect, useRef, useState } from 'react';
import { Palette, CalendarDays, Play, Users } from 'lucide-react';

function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <div ref={ref}>{count.toLocaleString('en-IN')}{suffix}</div>;
}

export function About() {
  const stats = [
    { label: 'Artists', value: 1200, suffix: '+', icon: Palette, color: 'from-red-500/10 to-red-600/5' },
    { label: 'Events', value: 85, suffix: '+', icon: CalendarDays, color: 'from-red-500/10 to-red-600/5' },
    { label: 'Videos', value: 340, suffix: '+', icon: Play, color: 'from-red-500/10 to-red-600/5' },
    { label: 'Community', value: 18, suffix: 'k+', icon: Users, color: 'from-red-500/10 to-red-600/5' },
  ];

  return (
    <section id="about" className="relative bg-(--color-background) section-padding overflow-hidden">
      {/* Section divider */}
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="lux-container">
        <div className="mx-auto max-w-2xl text-center fade-in">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-(--color-red) mb-6">
            About Us
          </span>
          <h2 className="heading-lg text-(--color-soft-black)">
            A home for <span className="text-gradient-red">art</span> and{' '}
            <span className="text-gradient-red">talent</span>.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-(--color-muted)">
            Let the talent talk connects artists, audiences, and communities through curated events,
            unforgettable performances, and talk shows designed with excellence in mind.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="group relative rounded-2xl bg-white p-6 border border-black/4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 fade-in overflow-hidden"
              >
                {/* Gradient bg on hover */}
                <div className={`absolute inset-0 bg-linear-to-br ${s.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-(--color-red) group-hover:bg-white/80 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold tracking-tight text-(--color-soft-black)">
                    <AnimatedCounter end={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-sm font-semibold text-(--color-muted)">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

