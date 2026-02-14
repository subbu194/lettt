import { ArrowDown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/shared/Button';
import logo from '@/assets/lettt-logo.png';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section id="hero" className="relative flex min-h-[calc(100vh-8rem)] items-center overflow-hidden bg-white">
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Dot pattern */}
        <div className="absolute inset-0 dot-pattern opacity-40" />
        {/* Gradient orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-red-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-125 h-125 rounded-full bg-red-50/80 blur-3xl" />
        {/* Floating geometric shapes */}
        <motion.div
          className="absolute top-1/4 right-[15%] w-20 h-20 rounded-2xl border border-red-200/40 rotate-12"
          animate={{ y: [-10, 10, -10], rotate: [12, 18, 12] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/3 left-[10%] w-14 h-14 rounded-full border border-red-200/30"
          animate={{ y: [8, -8, 8], x: [-4, 4, -4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[60%] right-[8%] w-8 h-8 bg-red-100/40 rounded-lg rotate-45"
          animate={{ y: [-6, 6, -6], rotate: [45, 50, 45] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="w-full px-5 py-20 sm:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={logo} alt="Let the talent talk" className="h-28 w-auto sm:h-36 md:h-48 lg:h-56 drop-shadow-xl" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="mt-6 heading-xl text-(--color-soft-black)"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <span className="animated-gradient-text">Let the Talent Talk</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="mt-5 text-lg leading-relaxed text-(--color-muted) max-w-xl mx-auto sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            Discover exclusive events, cinematic talk shows, and a community where talent rises.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <Button variant="red" size="lg" onClick={() => navigate('/events')} className="min-w-45 shadow-lg shadow-red-600/20 hover:shadow-red-600/40">
              <Sparkles className="h-4 w-4" />
              Explore Events
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/talkshow')} className="min-w-45">
              Watch Talk Show
            </Button>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.button
            className="mx-auto mt-16 flex flex-col items-center gap-2 text-sm font-medium text-(--color-muted) hover:text-(--color-red) transition-colors group"
            onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            aria-label="Scroll to About section"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className="text-xs tracking-widest uppercase">Discover More</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowDown className="h-5 w-5" />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </section>
  );
}

