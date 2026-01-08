type VideoLike = Record<string, unknown>;

export function VideoPlayer({ video }: { video: VideoLike }) {
  const title = String(video.title ?? video.name ?? 'Talk Show');
  const src = String(video.url ?? video.videoUrl ?? video.src ?? '');

  return (
    <div className="space-y-3">
      <div className="text-lg font-extrabold tracking-tight">{title}</div>
      {src ? (
        <video className="w-full rounded-2xl border border-black/10 bg-black" controls preload="metadata">
          <source src={src} />
        </video>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-black/5 p-8 text-sm text-black/70">
          Video source not available.
        </div>
      )}
    </div>
  );
}

