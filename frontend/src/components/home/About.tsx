import { Card } from '@/components/shared/Card';

export function About() {
  const stats = [
    { label: 'Artists', value: '1,200+' },
    { label: 'Events', value: '85+' },
    { label: 'Videos', value: '340+' },
    { label: 'Community Members', value: '18k+' },
  ];

  return (
    <section id="about" className="border-t border-black/10 bg-[var(--color-bg)]">
      <div className="lux-container py-16">
        <div className="mx-auto max-w-3xl text-center fade-in">
          <h2 className="text-3xl font-extrabold tracking-tight">
            A    home for <span className="animated-gradient-text">art</span> and <span className="animated-gradient-text">talent</span>.
          </h2>
          <p className="mt-4 text-[var(--color-muted)]">
            Let the talent talk connects artists, audiences, and communities through curated events, unforgettable performances, and
            talk shows designed with   in mind.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5 fade-in">
              <div className="text-2xl font-extrabold tracking-tight">{s.value}</div>
              <div className="mt-1 text-sm font-semibold tracking-wide text-black/60">{s.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

