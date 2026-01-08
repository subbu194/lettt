import { AboutContent } from '@/components/about/AboutContent';

export default function AboutPage() {
  return (
    <section className="bg-[var(--color-bg)]">
      <div className="lux-container py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight">About Us</h1>
          <p className="mt-3 text-[var(--color-muted)]">
            A   platform designed to elevate art, spotlight talent, and connect a    community.
          </p>
        </div>
        <div className="mt-10">
          <AboutContent />
        </div>
      </div>
    </section>
  );
}
