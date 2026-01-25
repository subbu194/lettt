import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/shared/PageTransition';
import { fadeInUp } from '@/utils/animations';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { useUIStore } from '@/store/useUIStore';
import { VideoPlayer } from '@/components/talkshow/VideoPlayer';

type VideoLike = Record<string, unknown>;

export default function TalkShowPage() {
  const [videos, setVideos] = useState<VideoLike[]>([]);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const openModal = useUIStore((s) => s.openModal);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videosResp, seasonsResp] = await Promise.all([
          apiClient.get<{ items: VideoLike[] }>('/talkshow?limit=50'),
          apiClient.get<{ seasons: number[] }>('/talkshow/seasons'),
        ]);
        setVideos(videosResp.data?.items || []);
        setSeasons(seasonsResp.data?.seasons || []);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredVideos = selectedSeason === 'all' 
    ? videos 
    : videos.filter(v => Number(v.season) === selectedSeason);

  // Extract YouTube video ID for thumbnail
  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  return (
    <PageTransition>
      <div className="bg-(--color-bg)">
        {/* Hero Section */}
        <div className="lux-container py-16">
          <motion.div
            className="max-w-3xl"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight">Talk Show</h1>
            <p className="mt-3 text-(--color-muted)">Intimate conversations and performances — curated for a premium experience.</p>
          </motion.div>
        </div>

        {/* Season Filter */}
        <div className="border-t border-black/10 bg-white">
          <div className="lux-container py-4">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedSeason('all')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                  selectedSeason === 'all'
                    ? 'bg-(--color-primary-red) text-white'
                    : 'border border-black/10 bg-white hover:bg-gray-50'
                }`}
              >
                All Seasons
              </button>
              {seasons.map((season) => (
                <button
                  key={season}
                  onClick={() => setSelectedSeason(season)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    selectedSeason === season
                      ? 'bg-(--color-primary-red) text-white'
                      : 'border border-black/10 bg-white hover:bg-gray-50'
                  }`}
                >
                  Season {season}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="lux-container py-12">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-black/5 bg-white shadow-sm animate-pulse">
                  <div className="aspect-video bg-gray-200 rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-black/10 bg-white p-6 text-center text-sm text-black/70">
              Error: {error}
            </div>
          ) : !filteredVideos.length ? (
            <div className="rounded-2xl border border-black/10 bg-white p-12 text-center">
              <p className="text-black/70">
                {selectedSeason === 'all' 
                  ? 'No videos available yet. Please check back soon.' 
                  : `No videos available for Season ${selectedSeason}.`}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVideos.map((video, idx) => {
                const id = String(video._id ?? idx);
                const title = String(video.title ?? 'Talk Show');
                const season = Number(video.season ?? 1);
                const episode = video.episodeNumber ? Number(video.episodeNumber) : null;
                const youtubeUrl = String(video.youtubeUrl ?? '');
                const videoId = getYouTubeId(youtubeUrl);
                const thumb = video.thumbnail ? String(video.thumbnail) : videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined;

                return (
                  <button
                    key={id}
                    type="button"
                    className="group text-left rounded-lg border border-black/5 bg-white shadow-sm transition-all hover:shadow-md hover:border-black/10"
                    onClick={() => openModal(<VideoPlayer video={video} />)}
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
                      <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                        S{season}{episode ? ` E${episode}` : ''}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-bold tracking-tight line-clamp-2 leading-snug" title={title}>{title}</h3>
                      <p className="mt-2 text-xs text-black/60">
                        Season {season}{episode ? ` · Episode ${episode}` : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
