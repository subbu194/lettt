import { Container } from '../components/ui/Container';
import { usePageMeta } from '../hooks/usePageMeta';

export default function About() {
  usePageMeta({
    title: 'About — Let the talent talk',
    description: 'Learn about Let the talent talk and our premium art & talent mission.',
  });

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">About</h1>
        <p className="mt-3 text-white/70">
          Let the talent talk is built to feel exclusive—premium motion, refined visuals, and a platform structure ready for
          production APIs.
        </p>
      </Container>
    </section>
  );
}


