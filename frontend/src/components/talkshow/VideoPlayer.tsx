type VideoLike = Record<string, unknown>;

// Handles: watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/
function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:shorts\/|live\/|v\/|embed\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function VideoPlayer({ video }: { video: VideoLike }) {
  const title = String(video.title ?? 'Talk Show');
  const description = video.description ? String(video.description) : '';
  const youtubeUrl = String(video.youtubeUrl ?? video.url ?? video.videoUrl ?? video.src ?? '');
  
  const videoId = extractYouTubeId(youtubeUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';

  return (
    <div className="space-y-3">
      <div className="text-lg font-extrabold tracking-tight">{title}</div>
      {embedUrl ? (
        <>
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-black/4 bg-black">
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          {description && (
            <p className="text-sm text-(--color-muted)">{description}</p>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-black/4 bg-black/5 p-8 text-sm text-(--color-muted)">
          Video source not available.
        </div>
      )}
    </div>
  );
}

