import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/Button';

export function CTA() {
  const navigate = useNavigate();

  return (
    <section id="cta" className="bg-[var(--color-primary-red)]">
      <div className="lux-container py-16">
        <div className="mx-auto max-w-3xl text-center fade-in">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Join the community where talent rises.
          </h2>
          <p className="mt-4 text-white/90">
            Create an account to access    drops, event purchases, and exclusive content.
          </p>
          <div className="mt-8 flex justify-center">
            <Button variant="gold" size="lg" onClick={() => navigate('/auth')}>
              Join Our Community
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

