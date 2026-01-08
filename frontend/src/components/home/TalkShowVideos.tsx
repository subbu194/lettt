import { useEffect, useState } from 'react';
import { get } from '@/api/client';
import { Card } from '@/components/shared/Card';
import { useUIStore } from '@/store/useUIStore';
import { VideoPlayer } from '@/components/talkshow/VideoPlayer';

type VideoLike = Record<string, unknown>;

export function TalkShowVideos() {
  const [videos, setVideos] = useState<VideoLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const openModal = useUIStore((s) => s.openModal);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await get<VideoLike[]>('/videos');
      if (error) setError(error);
      else setVideos(data || []);
      setLoading(false);
    };
    fetchVideos();
  }, []);

  return (
    <section id="talkshow-videos" className="border-t border-black/10 bg-[var(--color-bg)]">
      <div className="lux-container py-16">
        <div className="fade-in">
          <h2 className="text-3xl font-extrabold tracking-tight">Talk Show Videos</h2>
          <p className="mt-2 text-[var(--color-muted)]">Watch interviews, performances, and behind-the-scenes moments.</p>
        </div>

        <div className="mt-10 fade-in">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[240px] rounded-2xl border border-black/10 bg-white shadow-sm" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">Error: {error}</div>
          ) : !videos.length ? (
            <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">
              No videos available yet. Please check back soon.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video, idx) => {
                const rawId = video.id ?? video._id ?? video.title ?? video.name;
                const id = rawId ? String(rawId) : `video-${idx}`;
                const title = String(video.title ?? video.name ?? 'Talk Show');
                const views = Number(video.views ?? 0);
                const duration = String(video.duration ?? '—');
                const thumb = typeof video.thumbnail === 'string' ? video.thumbnail : undefined;

                return (
                  <button
                    key={id}
                    type="button"
                    className="text-left"
                    onClick={() => openModal(<VideoPlayer video={video} />)}
                    aria-label={`Play ${title}`}
                  >
                    <Card className="overflow-hidden hover:border-black/20 transition">
                      <div className="aspect-16-10 w-full bg-black/5">
                        {thumb ? <img src={thumb} alt={title} className="h-full w-full object-cover" loading="lazy" /> : null}
                      </div>
                      <div className="p-5">
                        <div className="truncate text-base font-extrabold tracking-tight">{title}</div>
                        <div className="mt-1 text-sm text-[var(--color-muted)]">
                          {views ? `${views.toLocaleString()} views` : 'New'} · {duration}
                        </div>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

