import { Mic, Palette, ShoppingBag, BookOpen } from 'lucide-react';

export function About() {
  const pillars = [
    { 
      title: 'Talk Show', 
      subtitle: 'Real Stories. Real Talent.',
      desc: 'We interview talented individuals from every field — entrepreneurs, artists, students, and changemakers. Through meaningful conversations, we bring out your journey and inspire others.',
      icon: Mic, 
      color: 'from-red-500/10 to-red-600/5' 
    },
    { 
      title: 'Art & Artists Exhibition', 
      subtitle: 'A Stage for Creativity',
      desc: 'Painters, sculptors, designers, and creative entrepreneurs can display and sell their artwork, promote their brands, and connect with a larger audience.',
      icon: Palette, 
      color: 'from-red-500/10 to-red-600/5' 
    },
    { 
      title: 'Online Art Platform', 
      subtitle: 'Taking Creativity Global',
      desc: 'An online space where artwork and paintings can be sold to art lovers across the world. Your art reaches homes, offices, and hearts everywhere.',
      icon: ShoppingBag, 
      color: 'from-red-500/10 to-red-600/5' 
    },
    { 
      title: 'Blogs & Catalogue', 
      subtitle: 'Documenting Talent',
      desc: 'Through inspiring blogs, feature stories, and show catalogues, we document and showcase talented individuals and their journeys for the world to see.',
      icon: BookOpen, 
      color: 'from-red-500/10 to-red-600/5' 
    },
  ];

  return (
    <section id="about" className="relative bg-(--color-background) section-padding overflow-hidden">
      {/* Section divider */}
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="lux-container">
        <div className="mx-auto max-w-3xl text-center fade-in">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-(--color-red) mb-6">
            The Four Pillars
          </span>
          <h2 className="heading-lg text-(--color-soft-black)">
            We are not here to <span className="text-gradient-red">judge</span>.{' '}
            We are here to give you a <span className="text-gradient-red">stage</span>.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-(--color-muted)">
            Our mission is simple — to help you showcase your talent to the world so everyone can see how awesome you truly are.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="group relative rounded-2xl bg-white p-8 border border-black/4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 fade-in overflow-hidden"
              >
                {/* Gradient bg on hover */}
                <div className={`absolute inset-0 bg-linear-to-br ${pillar.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-(--color-red) group-hover:bg-white/80 transition-colors">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-extrabold tracking-tight text-(--color-soft-black)">{pillar.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-(--color-red)">{pillar.subtitle}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-(--color-muted)">{pillar.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

