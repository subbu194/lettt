import { Card } from '@/components/shared/Card';

export function AboutContent() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <h2 className="text-2xl font-extrabold tracking-tight">Our Vision</h2>
        <p className="mt-3 text-black/70 leading-relaxed">
          Let The Talent Talk is built to deliver a premium experience through clean design, curated content, and effortless discovery. We spotlight artists and talent through exclusive events, cinematic talk shows, and a community that celebrates excellence.
        </p>
        <p className="mt-3 text-black/70 leading-relaxed">
          We believe creativity deserves a stage — and every performance deserves a world-class presentation. Our platform connects passionate audiences with exceptional talent, creating meaningful experiences that inspire and elevate the arts.
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-extrabold tracking-tight">What We Deliver</h3>
        <ul className="mt-4 space-y-3 text-sm text-black/70">
          <li>
            <span className="font-semibold text-black">Premium Events</span> — Curated experiences with elevated production quality.
          </li>
          <li>
            <span className="font-semibold text-black">Talk Shows</span> — Intimate conversations with featured guest talent.
          </li>
          <li>
            <span className="font-semibold text-black">Art Gallery</span> — A showcase of exceptional artwork and creative talent.
          </li>
          <li>
            <span className="font-semibold text-black">Community</span> — A space that connects creators and passionate audiences.
          </li>
        </ul>
      </Card>
    </div>
  );
}

