import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: Record<string, unknown>) => {
        mute: () => void;
        unMute: () => void;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export function AutoplayVideo() {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ mute: () => void; unMute: () => void } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.3 }
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const initPlayer = () => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: 'MhAR5LFctsQ',
          playerVars: {
            autoplay: 1, mute: 1, loop: 1, playlist: 'MhAR5LFctsQ',
            controls: 0, showinfo: 0, rel: 0, modestbranding: 1,
            fs: 0, disablekb: 1, iv_load_policy: 3,
          },
          events: {
            onReady: () => setIsPlayerReady(true),
          },
        });
      }
    };
    if (window.YT && window.YT.Player) initPlayer();
    else window.onYouTubeIframeAPIReady = initPlayer;
  }, [isVisible]);

  const toggleMute = () => {
    if (playerRef.current && isPlayerReady) {
      if (isMuted) { playerRef.current.unMute(); setIsMuted(false); }
      else { playerRef.current.mute(); setIsMuted(true); }
    }
  };

  return (
    <section className="relative w-full overflow-hidden">
      <div
        ref={videoRef}
        className="relative w-full aspect-video"
      >
        <div
          id="youtube-player"
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        />

        {/* Sound Toggle */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all duration-300 pointer-events-auto"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </section>
  );
}
