import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function AutoplayVideo() {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
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
          videoId: 'D_8cbxQMAU8',
          playerVars: {
            autoplay: 1, mute: 1, loop: 1, playlist: 'D_8cbxQMAU8',
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
    <section className="relative bg-(--color-soft-black) overflow-hidden">
      <div className="lux-container py-6">
        <div
          ref={videoRef}
          className="relative w-full h-70 sm:h-100 md:h-125 lg:h-150 overflow-hidden rounded-2xl shadow-2xl"
        >
          <div
            id="youtube-player"
            className="absolute inset-0 w-full h-full scale-150"
            style={{ pointerEvents: 'none' }}
          />

          {/* Vignette overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-black/20 pointer-events-none z-1" />

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all duration-300 pointer-events-auto"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </section>
  );
}
