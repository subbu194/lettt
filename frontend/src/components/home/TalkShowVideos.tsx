import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
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
      try {
        const resp = await apiClient.get<VideoLike[]>('/videos');
        setVideos(resp.data || []);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('talkshow-videos-scroll');
    if (container) {
      const scrollAmount = 350;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="talkshow-videos" className="border-t border-black/10 bg-(--color-bg)">
      <div className="w-full px-4 py-12 sm:px-6">
        <div className="fade-in flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Talk Show Videos</h2>
            <p className="mt-1 text-sm text-(--color-muted)">Watch interviews and behind-the-scenes moments</p>
          </div>
          
          {!loading && !error && videos.length > 3 && (
            <div className="hidden gap-2 md:flex">
              <button
                onClick={() => scroll('left')}
                className="rounded-full border border-black/10 bg-white p-2 hover:bg-gray-50 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scroll('right')}
                className="rounded-full border border-black/10 bg-white p-2 hover:bg-gray-50 transition"
                aria-label="Scroll right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 fade-in">
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-w-[240px] h-[220px] rounded-lg bg-white border border-black/5 shadow-sm animate-pulse">
                  <div className="aspect-video bg-gray-200 rounded-t-lg" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">Error: {error}</div>
          ) : !videos.length ? (
            <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">
              No videos available yet. Please check back soon.
            </div>
          ) : (
            <div 
              id="talkshow-videos-scroll"
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
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
                    className="group min-w-[240px] max-w-[240px] snap-start text-left rounded-lg border border-black/5 bg-white shadow-sm transition-all hover:shadow-md hover:border-black/10"
                    onClick={() => openModal(<VideoPlayer video={video} />)}
                    aria-label={`Play ${title}`}
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-black/5">
                      {thumb ? (
                        <img src={thumb} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">🎬</div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="rounded-full bg-white/90 p-3">
                          <svg className="h-6 w-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-bold tracking-tight line-clamp-2 leading-snug" title={title}>{title}</h3>
                      <p className="mt-1 text-xs text-black/60">
                        {views ? `${views.toLocaleString()} views` : 'New'} · {duration}
                      </p>
                    </div>
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
