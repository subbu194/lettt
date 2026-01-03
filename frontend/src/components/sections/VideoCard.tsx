import type { Video } from '../../types';
import { useUiStore } from '../../store/useStore';
import { useState } from 'react';

function Thumb({ src, title }: { src?: string; title: string }) {
  const [ok, setOk] = useState(true);
  if (src && ok) {
    return (
      <img
        src={src}
        alt={`${title} thumbnail`}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setOk(false)}
      />
    );
  }
  return (
    <div
      className="h-full w-full bg-[radial-gradient(900px_450px_at_20%_20%,rgba(255,215,0,0.18),transparent_55%),radial-gradient(700px_500px_at_80%_60%,rgba(255,0,0,0.22),transparent_55%),linear-gradient(140deg,#050505,#0d0d0d,#050505)]"
      role="img"
      aria-label={`${title} thumbnail placeholder`}
    />
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function VideoCard({ video }: { video: Video }) {
  const open = useUiStore((s) => s.openVideoModal);

  return (
    <button
      className="video-card glass luxe-glow rounded-2xl overflow-hidden text-left hover:bg-white/10 transition"
      onClick={() => open(video)}
      aria-label={`Open video: ${video.title}`}
    >
      <div className="aspect-video overflow-hidden relative">
        <Thumb src={video.thumbnailWebp} title={video.title} />
        <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-xs text-white/90 border border-white/10">
          {formatDuration(video.durationSeconds)}
        </span>
      </div>
      <div className="p-5">
        <div className="font-semibold tracking-tight line-clamp-2">{video.title}</div>
        <div className="mt-2 text-sm text-white/65">{video.views.toLocaleString()} views</div>
      </div>
    </button>
  );
}


