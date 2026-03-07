import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (loading || !videos.length) return;

    const state = location.state as { openVideoId?: string } | null;
    const targetId = state?.openVideoId;
    if (!targetId) return;

    const selectedVideo = videos.find((video) => String(video._id ?? '') === targetId);
    if (!selectedVideo) {
      navigate(location.pathname, { replace: true, state: null });
      return;
    }

    openModal(<VideoPlayer video={selectedVideo} />);
    navigate(location.pathname, { replace: true, state: null });
  }, [loading, videos, location.pathname, location.state, navigate, openModal]);

  const filteredVideos = selectedSeason === 'all' 
    ? videos 
    : videos.filter(v => Number(v.season) === selectedSeason);

  // Handles: watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/
  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:shorts\/|live\/|v\/|embed\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  return (
    <PageTransition>
      <div className="bg-(--color-background)">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-(--color-soft-black) py-20 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-red-600/15 blur-[120px]" />
          <div className="lux-container relative">
            <motion.div
              className="max-w-3xl"
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">Talk Show</span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Latest <span className="text-gradient-red">Episodes</span></h1>
              <p className="mt-3 text-white/60">Intimate conversations and performances — curated for a premium experience.</p>
            </motion.div>
          </div>
        </div>

        {/* Season Filter */}
        <div className="border-b border-black/4 bg-white sticky top-18 z-20">
          <div className="lux-container py-4">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedSeason('all')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                  selectedSeason === 'all'
                    ? 'bg-(--color-red) text-white'
                    : 'border border-black/4 bg-white hover:bg-gray-50'
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
                      ? 'bg-(--color-red) text-white'
                      : 'border border-black/4 bg-white hover:bg-gray-50'
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
                <div key={i} className="rounded-2xl border border-black/4 bg-white shadow-sm animate-pulse">
                  <div className="aspect-video bg-gray-100 rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-black/4 bg-white p-6 text-center text-sm text-(--color-muted)">
              Error: {error}
            </div>
          ) : !filteredVideos.length ? (
            <div className="rounded-2xl border border-black/4 bg-white p-16 text-center">
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
                const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined;

                return (
                  <button
                    key={id}
                    type="button"
                    className="group text-left rounded-2xl border border-black/4 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 duration-300"
                    onClick={() => openModal(<VideoPlayer video={video} />)}
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-gray-50">
                      {thumb ? (
                        <img src={thumb} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">🎬</div>
                      )}
                      {/* Duration Badge */}
                      {video.duration ? (
                        <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold tracking-wider text-white backdrop-blur-md">
                          {video.duration as string}
                        </div>
                      ) : null}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="rounded-full bg-white/90 p-3 shadow-lg">
                          <svg className="h-6 w-6 text-(--color-red)" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        S{season}{episode ? ` E${episode}` : ''}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-bold tracking-tight line-clamp-2 leading-snug" title={title}>{title}</h3>
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
      </div>
    </PageTransition>
  );
}
