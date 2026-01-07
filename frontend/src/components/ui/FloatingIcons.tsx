import React from 'react';

function ArtistIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 3c-4 0-7 3-7 7 0 2 1 3 1 3s-1 2-1 4c0 2 2 3 5 3 3 0 6-1 6-3 0-2-1-4-1-4s1-1 1-3c0-4-3-7-7-7z" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="10.5" r="0.8" fill="currentColor" />
      <circle cx="14.5" cy="10.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function MicIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth={1.2} />
      <path d="M12 17v4" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
      <path d="M8 21h8" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

export function FloatingIcons() {
  return (
    <div aria-hidden className="pointer-events-none">
      <div className="floating-icon left top text-red-500/90">
        <ArtistIcon className="w-12 h-12" />
      </div>

      <div className="floating-icon right mid text-yellow-400/95">
        <MicIcon className="w-14 h-14" />
      </div>

      <div className="floating-icon left-bottom text-red-500/75">
        <MicIcon className="w-10 h-10" />
      </div>

      <div className="floating-icon right-top text-yellow-400/65">
        <ArtistIcon className="w-8 h-8" />
      </div>
    </div>
  );
}

export default FloatingIcons;


