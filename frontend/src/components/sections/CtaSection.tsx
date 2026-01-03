import { Container } from '../ui/Container';
import { Button } from '../ui/Button';

export function CtaSection() {
  return (
    <section className="py-16 sm:py-20 bg-accent">
      <Container>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg">
              Join the community shaping culture.
            </h2>
            <p className="mt-3 text-white/90">
              Early access to events, premium content, and invitations crafted for those who belong.
            </p>
          </div>
          <Button
            variant="outlineHighlight"
            className="bg-black/10 border-fg/20 text-fg hover:bg-black/20 shadow-[0_0_30px_rgba(255,215,0,0.18)]"
          >
            Join Our Community
          </Button>
        </div>
      </Container>
    </section>
  );
}


