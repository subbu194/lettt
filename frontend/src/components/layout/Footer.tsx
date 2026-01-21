import { Instagram, Twitter, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-(--color-bg)">
      <div className="lux-container py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3">
            <div className="font-extrabold tracking-[0.18em]">Let the talent talk</div>
            <p className="text-sm leading-relaxed text-black/70">
              A    art & talent platform for exclusive events, talk shows, and community experiences.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold tracking-wide">Platform</div>
            <ul className="mt-3 space-y-2 text-sm text-black/70">
              <li>
                <Link className="hover:text-black" to="/events">
                  Events
                </Link>
              </li>
              <li>
                <Link className="hover:text-black" to="/talkshow">
                  Talk Show
                </Link>
              </li>
              <li>
                <Link className="hover:text-black" to="/purchase">
                  Purchase
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold tracking-wide">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-black/70">
              <li>
                <Link className="hover:text-black" to="/about">
                  About Us
                </Link>
              </li>
              <li>
                <Link className="hover:text-black" to="/auth">
                  Login / Signup
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold tracking-wide">Social</div>
            <div className="mt-3 flex items-center gap-3">
              <a
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-(--color-primary-gold) hover:border-black/20"
                href="#"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-(--color-primary-gold) hover:border-black/20"
                href="#"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-(--color-primary-gold) hover:border-black/20"
                href="#"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-black/10 pt-6 text-xs text-black/60 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Let the talent talk. All rights reserved.</div>
          <div className="flex gap-4">
            <a className="hover:text-black" href="#">
              Privacy
            </a>
            <a className="hover:text-black" href="#">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

