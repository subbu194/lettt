import { Container } from '../components/ui/Container';
import { usePageMeta } from '../hooks/usePageMeta';

export default function Events() {
  usePageMeta({
    title: 'Events — Let the talent talk',
    description: 'Explore curated luxury events and premium experiences.',
  });

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Events</h1>
        <p className="mt-3 text-white/70">Events listing will be powered by the `/events` API module.</p>
      </Container>
    </section>
  );
}


