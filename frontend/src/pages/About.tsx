import { motion } from 'framer-motion';
import { PageTransition } from '@/components/shared/PageTransition';
import { fadeInUp } from '@/utils/animations';
import { Quote, Target, Heart, Users, Lightbulb, Award, Mic, Palette, ShoppingBag, BookOpen } from 'lucide-react';

export default function AboutPage() {
  const pillars = [
    {
      icon: Mic,
      title: 'Talk Show',
      subtitle: 'Real Stories. Real Talent.',
      desc: 'We interview talented individuals from every field — entrepreneurs, artists, students, and changemakers. Through meaningful conversations, we bring out your journey and inspire others.',
    },
    {
      icon: Palette,
      title: 'Art & Artists Exhibition',
      subtitle: 'A Stage for Creativity',
      desc: 'Painters, sculptors, designers, and creative entrepreneurs can display and sell their artwork, promote their brands, and connect with a larger audience.',
    },
    {
      icon: ShoppingBag,
      title: 'Online Art Platform',
      subtitle: 'Taking Creativity Global',
      desc: 'An online space where artwork and paintings can be sold to art lovers across the world. Your art reaches homes, offices, and hearts everywhere.',
    },
    {
      icon: BookOpen,
      title: 'Blogs & Catalogue',
      subtitle: 'Documenting Talent',
      desc: 'Through inspiring blogs, feature stories, and show catalogues, we document and showcase talented individuals and their journeys for the world to see.',
    },
  ];

  const founderPhilosophies = [
    'Be A Brand Before Building A Brand.',
    'Growth happens when we grow together.',
    'Positivity accelerates success.',
    'Recognition creates confidence.',
  ];

  return (
    <PageTransition>
      <section className="bg-(--color-background)">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-(--color-soft-black) py-24 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-red-600/15 blur-[120px]" />
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-[120px]" />
          <div className="lux-container relative">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">About Us</span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                Let The Talent Talk
              </h1>
              <p className="mt-4 text-2xl font-medium text-gradient-red">
                Where Every Talent Finds a Voice
              </p>
              <p className="mt-6 text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
                Let The Talent Talk is not a regular talent show. It is a platform built around you and your talent. We believe in one powerful philosophy: Everyone is special in their own unique way.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="lux-container py-20">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-red-50 text-(--color-red) mb-6">
              <Target className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-(--color-soft-black) md:text-4xl">
              Our Mission
            </h2>
            <p className="mt-6 text-xl text-(--color-muted) leading-relaxed">
              We are not here to judge. We are not here to give meaningless ratings.{' '}
              <span className="text-(--color-red) font-semibold">We are here to give you a stage.</span>
            </p>
            <p className="mt-4 text-lg text-(--color-muted) leading-relaxed">
              Our mission is simple — to help you showcase your talent to the world so everyone can see how awesome you truly are.
            </p>
          </motion.div>
        </div>

        {/* Four Pillars Section */}
        <div className="bg-white py-20">
          <div className="lux-container">
            <motion.div
              className="text-center mb-14"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-(--color-red) mb-4">
                What We Do
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-(--color-soft-black) md:text-4xl">
                The Four Pillars
              </h2>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {pillars.map((pillar, index) => {
                const Icon = pillar.icon;
                return (
                  <motion.div
                    key={pillar.title}
                    className="group relative rounded-2xl bg-(--color-background) p-8 border border-black/4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start gap-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-(--color-red) group-hover:bg-(--color-red) group-hover:text-white transition-colors">
                        <Icon className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-extrabold tracking-tight text-(--color-soft-black)">{pillar.title}</h3>
                        <p className="mt-1 text-sm font-semibold text-(--color-red)">{pillar.subtitle}</p>
                        <p className="mt-3 text-(--color-muted) leading-relaxed">{pillar.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Vision Section */}
        <div className="relative overflow-hidden bg-(--color-soft-black) py-20 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="lux-container relative">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 text-white mb-6">
                <Lightbulb className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Our Vision</h2>
              <div className="mt-8 space-y-4 text-lg text-white/70">
                <p>To build a world where talent is not hidden.</p>
                <p>To create a platform where appreciation replaces judgment.</p>
                <p>To ensure that every gifted individual gets the spotlight they deserve.</p>
              </div>
              <p className="mt-8 text-2xl font-bold text-gradient-red">
                Because when talent speaks, the world listens.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Founder Section */}
        <div className="lux-container py-24">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-(--color-red) mb-4">
              Meet The Visionary
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-(--color-soft-black) md:text-4xl">
              About The Founder
            </h2>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {/* Founder Card */}
            <motion.div
              className="relative rounded-3xl bg-linear-to-br from-(--color-soft-black) to-gray-900 p-10 md:p-14 text-white overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-red-600/10 blur-3xl" />
              
              <div className="relative">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                  {/* Founder Info */}
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 mb-6">
                      <Award className="h-4 w-4" />
                      Founder & Brand Ambassador
                    </div>
                    <h3 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                      Salman <span className="text-gradient-red">WTBI</span>
                    </h3>
                    <p className="mt-2 text-lg text-white/60">
                      Founder & Director – WTBI India Pvt. Ltd.
                    </p>
                    
                    <div className="mt-8 space-y-4 text-white/70 leading-relaxed">
                      <p className="text-xl font-medium text-white/90">
                        Some leaders build companies. Some leaders build communities.{' '}
                        <span className="text-(--color-red)">Salman WTBI builds people.</span>
                      </p>
                      <p>
                        An entrepreneur by profession and a visionary by purpose, Salman's journey began with a simple belief — success is meaningful only when it uplifts others.
                      </p>
                      <p>
                        Through his leadership at WTBI India Pvt. Ltd., he transformed imagination into reality, delivering premium interiors, construction, furniture, and industrial projects with integrity and excellence.
                      </p>
                      <p>
                        <span className="font-semibold text-white">WTBI — Way To Beyond Imagination</span> — is not just a company name. It reflects Salman's mindset: to go beyond limits, beyond expectations, and beyond ordinary thinking.
                      </p>
                    </div>
                  </div>
                </div>

                {/* The Birth of Let The Talent Talk */}
                <div className="mt-12 pt-10 border-t border-white/10">
                  <h4 className="text-2xl font-extrabold mb-6">The Birth of Let The Talent Talk</h4>
                  <div className="space-y-4 text-white/70 leading-relaxed">
                    <p>
                      While building spaces for clients, Salman noticed something deeper. He saw hidden talents. He saw untold stories. He saw brilliant individuals who simply lacked a platform.
                    </p>
                    <p>
                      <span className="text-white font-medium">Let The Talent Talk was not created as a show. It was created as a movement.</span> A movement where talent is celebrated — not judged. Where stories are shared — not rated. Where individuals are appreciated — not compared.
                    </p>
                    <p>
                      Salman redefined the concept of a talent platform. Instead of competition, he introduced conversation. Instead of elimination, he introduced elevation.
                    </p>
                  </div>
                </div>

                {/* Philosophies */}
                <div className="mt-12 pt-10 border-t border-white/10">
                  <h4 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
                    <Heart className="h-6 w-6 text-(--color-red)" />
                    Leadership Philosophies
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {founderPhilosophies.map((philosophy, index) => (
                      <motion.div
                        key={index}
                        className="rounded-xl bg-white/5 border border-white/10 p-5"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <p className="text-white font-medium">"{philosophy}"</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Founder's Message */}
            <motion.div
              className="mt-12 rounded-2xl bg-red-50 border border-red-100 p-10 md:p-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-start gap-4">
                <Quote className="h-10 w-10 text-(--color-red) shrink-0 mt-1" />
                <div>
                  <h4 className="text-xl font-extrabold text-(--color-soft-black) mb-4">Founder's Message</h4>
                  <blockquote className="text-lg text-(--color-muted) leading-relaxed italic">
                    "I believe talent is one of the purest gifts given to humanity. It doesn't matter where you come from, what your age is, or what your background looks like. If you have talent, you deserve a platform.
                    <br /><br />
                    Let The Talent Talk exists to remind people of their worth. We are not here to judge you. We are here to celebrate you.
                    <br /><br />
                    Because when you recognize your own talent, your life changes. And when the world recognizes it, your impact multiplies."
                  </blockquote>
                  <p className="mt-6 text-(--color-soft-black) font-bold">— Salman WTBI</p>
                </div>
              </div>
            </motion.div>

            {/* Vision for Future */}
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-red-50 text-(--color-red) mb-6">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-extrabold text-(--color-soft-black) mb-4">Vision For The Future</h3>
              <p className="text-lg text-(--color-muted) max-w-2xl mx-auto leading-relaxed">
                Salman envisions Let The Talent Talk becoming a global ecosystem — connecting talents across cities, countries, and industries. A platform where creativity meets opportunity, and passion meets recognition.
              </p>
              <div className="mt-8 space-y-2 text-(--color-soft-black) font-semibold">
                <p>To build stages.</p>
                <p>To build confidence.</p>
                <p>To build legacies.</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Signature Quote */}
        <div className="relative overflow-hidden bg-(--color-soft-black) py-20 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="lux-container relative">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-2xl md:text-3xl font-bold leading-relaxed">
                "Don't wait for the world to discover you.
                <br />
                <span className="text-gradient-red">Let your talent talk</span> — and the world will listen."
              </p>
              <p className="mt-6 text-white/60 font-semibold">— Salman WTBI</p>
            </motion.div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
