import { Container } from '../components/ui/Container';
import { usePageMeta } from '../hooks/usePageMeta';

export default function TalkShow() {
  usePageMeta({
    title: 'Talk Show — Let the talent talk',
    description: 'Watch cinematic conversations featuring artists and creators.',
  });

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Talk Show</h1>
        <p className="mt-3 text-white/70">Full library page (API-driven) is next.</p>
      </Container>
    </section>
  );
}


