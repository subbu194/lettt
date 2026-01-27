import { useEffect } from 'react';
import { About } from '@/components/home/About';
import { CTA } from '@/components/home/CTA';
import { FeaturedEvents } from '@/components/home/FeaturedEvents';
import { FeaturedArt } from '@/components/home/FeaturedArt';
import { Hero } from '@/components/home/Hero';
import { TalkShowVideos } from '@/components/home/TalkShowVideos';
import { AutoplayVideo } from '@/components/home/AutoplayVideo';
import { PageTransition } from '@/components/shared/PageTransition';

export default function HomePage() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.fade-in'));
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <PageTransition>
      <div>
        <Hero />
        <AutoplayVideo />
        <About />
        <FeaturedEvents />
        <FeaturedArt />
        <TalkShowVideos />
        <CTA />
      </div>
    </PageTransition>
  );
}
