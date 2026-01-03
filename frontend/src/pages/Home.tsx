import { usePageMeta } from '../hooks/usePageMeta';
import { AboutSection } from '../components/sections/AboutSection';
import { CtaSection } from '../components/sections/CtaSection';
import { FeaturedEventsSection } from '../components/sections/FeaturedEventsSection';
import { Footer } from '../components/sections/Footer';
import { HeroSection } from '../components/sections/HeroSection';
import { TalkShowSection } from '../components/sections/TalkShowSection';

export default function Home() {
  usePageMeta({
    title: 'Let the talent talk — Luxury Art & Talent Platform',
    description:
      'Exclusive events, cinematic talk shows, and premium community engagement — designed to feel luxury, smooth, and high-end.',
  });

  return (
    <>
      <HeroSection />
      <AboutSection />
      <FeaturedEventsSection />
      <TalkShowSection />
      <CtaSection />
      <Footer />
    </>
  );
}


