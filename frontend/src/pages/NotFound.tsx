import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFound() {
  usePageMeta({ title: 'Not Found — Let the talent talk' });

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="glass rounded-2xl p-8">
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="mt-2 text-white/70">The page you requested doesn’t exist.</p>
          <div className="mt-5">
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}


