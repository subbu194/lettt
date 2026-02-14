import { Instagram, Twitter, Youtube, ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="relative bg-(--color-soft-black) text-white overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-red-600/3 rounded-full blur-3xl pointer-events-none" />

      {/* Top accent line */}
      <div className="h-1 bg-linear-to-r from-transparent via-red-600 to-transparent" />

      <div className="lux-container relative">
        {/* Main Footer Content */}
        <div className="grid gap-12 py-16 md:grid-cols-12">
          {/* Brand Section */}
          <div className="md:col-span-4 space-y-5">
            <div className="luckiest-guy-regular text-2xl tracking-[0.12em] bg-linear-to-r from-white to-white/60 bg-clip-text text-transparent">
              LET THE TALENT TALK
            </div>
            <p className="text-sm leading-relaxed text-white/50 max-w-xs">
              A premium art & talent platform for exclusive events, cinematic talk shows, and unforgettable community experiences.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/6 text-white/60 hover:bg-(--color-red) hover:text-white transition-all duration-300 hover:scale-110"
                href="#"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/6 text-white/60 hover:bg-(--color-red) hover:text-white transition-all duration-300 hover:scale-110"
                href="#"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/6 text-white/60 hover:bg-(--color-red) hover:text-white transition-all duration-300 hover:scale-110"
                href="#"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="md:col-span-2">
            <div className="text-xs font-bold tracking-widest uppercase text-white/30 mb-5">Platform</div>
            <ul className="space-y-3">
              {[
                { to: '/events', label: 'Events' },
                { to: '/art', label: 'Art Gallery' },
                { to: '/talkshow', label: 'Talk Show' },
                { to: '/gallery', label: 'Gallery' },
              ].map((link) => (
                <li key={link.to}>
                  <Link className="text-sm text-white/50 hover:text-white transition-colors duration-200 flex items-center gap-1 group" to={link.to}>
                    {link.label}
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="md:col-span-2">
            <div className="text-xs font-bold tracking-widest uppercase text-white/30 mb-5">Company</div>
            <ul className="space-y-3">
              {[
                { to: '/about', label: 'About Us' },
                { to: '/auth', label: 'Sign In' },
                { to: '/orders', label: 'My Orders' },
                { to: '/my-tickets', label: 'My Tickets' },
              ].map((link) => (
                <li key={link.to}>
                  <Link className="text-sm text-white/50 hover:text-white transition-colors duration-200 flex items-center gap-1 group" to={link.to}>
                    {link.label}
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div className="md:col-span-4">
            <div className="text-xs font-bold tracking-widest uppercase text-white/30 mb-5">Stay Updated</div>
            <p className="text-sm text-white/50 mb-4">Get notified about new events, art drops, and exclusive content.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-11 rounded-xl bg-white/6 border border-white/8 px-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all"
              />
              <button className="h-11 px-5 rounded-xl bg-(--color-red) text-white text-sm font-semibold hover:bg-red-700 transition-all duration-300 shadow-lg shadow-red-600/20 hover:shadow-red-600/40">
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col gap-3 border-t border-white/6 py-6 text-xs text-white/30 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} Let the talent talk.</span>
            <span className="hidden sm:inline">Made with</span>
            <Heart className="hidden sm:inline h-3 w-3 text-red-500 fill-red-500" />
            <span className="hidden sm:inline">in India.</span>
          </div>
          <div className="flex gap-6">
            <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-white transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-white transition-colors" href="#">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

