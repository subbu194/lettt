import { Card } from '@/components/shared/Card';

export function AboutContent() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <h2 className="text-2xl font-extrabold tracking-tight">Our vision</h2>
        <p className="mt-3 text-black/70 leading-relaxed">
          Let the talent talk is built for a  -first experience: clean design,    curation, and effortless discovery. We
          spotlight artists and talent through exclusive events, cinematic talk shows, and a community that celebrates
          excellence.
        </p>
        <p className="mt-3 text-black/70 leading-relaxed">
          We believe creativity deserves a stage — and every performance deserves a world-class presentation.
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-extrabold tracking-tight">What we deliver</h3>
        <ul className="mt-4 space-y-3 text-sm text-black/70">
          <li>
            <span className="font-semibold text-black">  events</span> with elevated production.
          </li>
          <li>
            <span className="font-semibold text-black">Talk shows</span> with curated guest talent.
          </li>
          <li>
            <span className="font-semibold text-black">Community</span> that connects creators and fans.
          </li>
        </ul>
      </Card>
    </div>
  );
}

