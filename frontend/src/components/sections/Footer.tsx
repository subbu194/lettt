import { Instagram, Twitter, Youtube } from 'lucide-react';
import { Container } from '../ui/Container';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-bg py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="font-semibold tracking-wide">Let the talent talk</div>
            <p className="mt-3 text-sm text-white/65">
              Luxury art & talent experiences — cinematic, smooth, and exclusive by design.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-white/80">Platform</div>
            <ul className="mt-3 space-y-2 text-sm text-white/65">
              <li className="hover:text-fg transition">Events</li>
              <li className="hover:text-fg transition">Talk Show</li>
              <li className="hover:text-fg transition">Community</li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-white/80">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-white/65">
              <li className="hover:text-fg transition">About</li>
              <li className="hover:text-fg transition">Press</li>
              <li className="hover:text-fg transition">Contact</li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-white/80">Follow</div>
            <div className="mt-3 flex items-center gap-3">
              <a aria-label="Instagram" className="luxe-glow rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition" href="#">
                <Instagram className="h-5 w-5 text-highlight" />
              </a>
              <a aria-label="Twitter" className="luxe-glow rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition" href="#">
                <Twitter className="h-5 w-5 text-highlight" />
              </a>
              <a aria-label="YouTube" className="luxe-glow rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition" href="#">
                <Youtube className="h-5 w-5 text-highlight" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-white/55">
          <div>© {new Date().getFullYear()} Let the talent talk. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span className="hover:text-fg transition">Privacy</span>
            <span className="hover:text-fg transition">Terms</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}


