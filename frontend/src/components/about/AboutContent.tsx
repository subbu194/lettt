import { Card } from '@/components/shared/Card';
import { Sparkles, Calendar, Play, Users } from 'lucide-react';

const features = [
  { icon: Sparkles, title: 'Premium Events', desc: 'Curated experiences with elevated production quality.' },
  { icon: Play, title: 'Talk Shows', desc: 'Intimate conversations with featured guest talent.' },
  { icon: Calendar, title: 'Art Gallery', desc: 'A showcase of exceptional artwork and creative talent.' },
  { icon: Users, title: 'Community', desc: 'A space that connects creators and passionate audiences.' },
];

export function AboutContent() {
  return (
    <div className="space-y-10">
      <Card className="p-8">
        <h2 className="text-2xl font-extrabold tracking-tight">Our Vision</h2>
        <p className="mt-4 text-(--color-muted) leading-relaxed">
          Let The Talent Talk is built to deliver a premium experience through clean design, curated content, and effortless discovery. We spotlight artists and talent through exclusive events, cinematic talk shows, and a community that celebrates excellence.
        </p>
        <p className="mt-4 text-(--color-muted) leading-relaxed">
          We believe creativity deserves a stage — and every performance deserves a world-class presentation. Our platform connects passionate audiences with exceptional talent, creating meaningful experiences that inspire and elevate the arts.
        </p>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        {features.map((f) => (
          <Card key={f.title} className="p-6 group hover:border-red-100 transition-colors">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-(--color-red) group-hover:bg-(--color-red) group-hover:text-white transition-colors">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold tracking-tight">{f.title}</h3>
            <p className="mt-2 text-sm text-(--color-muted) leading-relaxed">{f.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

