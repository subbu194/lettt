import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
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
        const resp = await apiClient.get<{ items: VideoLike[] }>('/talkshow?limit=12&sortBy=createdAt&sortOrder=desc');
        setVideos(resp.data?.items || []);
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
      const scrollAmount = 360;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="talkshow-videos" className="relative bg-(--color-background) section-padding overflow-hidden">
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="lux-container">
        <div className="fade-in flex items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-(--color-red) mb-4">
              Talk Show
            </span>
            <h2 className="heading-md text-(--color-soft-black)">Latest Episodes</h2>
            <p className="mt-2 text-sm text-(--color-muted) max-w-md">Watch interviews and behind-the-scenes moments</p>
          </div>

          <div className="flex items-center gap-2">
            {!loading && !error && videos.length > 3 && (
              <div className="hidden gap-2 md:flex mr-3">
                <button
                  onClick={() => scroll('left')}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/6 bg-white hover:bg-gray-50 hover:border-black/10 transition-all shadow-xs"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/6 bg-white hover:bg-gray-50 hover:border-black/10 transition-all shadow-xs"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            <Link to="/talkshow" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-(--color-red) hover:underline group">
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="mt-8 fade-in">
          {loading ? (
            <div className="flex gap-5 overflow-x-auto pb-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="min-w-70 rounded-2xl bg-white border border-black/4 shadow-sm animate-pulse">
                  <div className="aspect-video bg-gray-100 rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
                    <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-sm text-red-600">{error}</div>
          ) : !videos.length ? (
            <div className="rounded-2xl bg-gray-50 border border-black/4 p-8 text-center text-sm text-(--color-muted)">
              No videos available yet. Check back soon!
            </div>
          ) : (
            <div
              id="talkshow-videos-scroll"
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-1 px-1"
            >
              {videos.map((video, idx) => {
                const rawId = video._id ?? video.id ?? idx;
                const id = String(rawId);
                const title = String(video.title ?? 'Talk Show');
                const season = Number(video.season ?? 1);
                const episode = video.episodeNumber ? Number(video.episodeNumber) : null;
                const youtubeUrl = String(video.youtubeUrl ?? '');

                const getYouTubeId = (url: string) => {
                  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
                  const match = url.match(regex);
                  return match ? match[1] : null;
                };

                const videoId = getYouTubeId(youtubeUrl);
                const thumb = video.thumbnail ? String(video.thumbnail) : videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined;

                return (
                  <button
                    key={id}
                    type="button"
                    className="group min-w-70 max-w-70 snap-start text-left rounded-2xl bg-white border border-black/4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    onClick={() => openModal(<VideoPlayer video={video} />)}
                    aria-label={`Play ${title}`}
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-gray-100">
                      {thumb ? (
                        <img src={thumb} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-linear-to-br from-red-50 to-gray-50">
                          <Play className="h-12 w-12 text-red-200" />
                        </div>
                      )}
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                          <Play className="h-6 w-6 text-(--color-red) fill-(--color-red) ml-0.5" />
                        </div>
                      </div>
                      {/* Season/Episode Badge */}
                      <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-white">
                        S{season}{episode ? ` E${episode}` : ''}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-bold tracking-tight line-clamp-2 text-(--color-soft-black) group-hover:text-(--color-red) transition-colors" title={title}>{title}</h3>
                      <p className="mt-2 text-xs text-(--color-muted)">
                        Season {season}{episode ? ` · Episode ${episode}` : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Link to="/talkshow" className="mt-6 flex sm:hidden items-center justify-center gap-1.5 text-sm font-semibold text-(--color-red)">
          View All Episodes <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
