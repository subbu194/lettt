import { useMemo } from 'react';
import type { Video } from '../../types';
import { useUiStore } from '../../store/useStore';
import { Container } from '../ui/Container';
import { Modal } from '../ui/Modal';
import { VideoCard } from './VideoCard';

export function TalkShowSection() {
  const modal = useUiStore((s) => s.modal);
  const closeModal = useUiStore((s) => s.closeModal);

  const yt = (id: string) => ({
    thumbnailWebp: `https://i.ytimg.com/vi_webp/${id}/hqdefault.webp`,
    playbackUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`,
  });

  const videos = useMemo<Video[]>(
    () => {
      // Randomized YouTube selection (demo only). Replace with API-driven list later.
      const picks: Array<{ id: string; title: string }> = [
        { id: 'kXYiU_JCYtU', title: 'Numb — Linkin Park' },
        { id: 'RgKAFK5djSk', title: 'See You Again — Wiz Khalifa ft. Charlie Puth' },
        { id: 'fRh_vgS2dFE', title: 'Sorry — Justin Bieber' },
        { id: 'hTWKbfoikeg', title: 'Smells Like Teen Spirit — Nirvana' },
        { id: 'YQHsXMglC9A', title: 'Hello — Adele' },
        { id: 'OPf0YbXqDm0', title: 'Uptown Funk — Mark Ronson ft. Bruno Mars' },
      ];

      const shuffled = [...picks].sort(() => Math.random() - 0.5).slice(0, 3);
      return shuffled.map((p) => ({
        id: p.id,
        title: p.title,
        views: Math.floor(50_000 + Math.random() * 950_000),
        durationSeconds: Math.floor(8 * 60 + Math.random() * 18 * 60),
        ...yt(p.id),
      }));
    },
    []
  );

  const activeVideo = modal.open && modal.type === 'video' ? modal.payload.video : null;

  return (
    <section id="talk-show" className="py-16 sm:py-24">
      <Container>
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Talk Show Videos</h2>
          <p className="mt-3 text-white/70">
            Interviews, breakdowns, and cinematic conversations—built for creators and collectors.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      </Container>

      <Modal open={Boolean(activeVideo)} title={activeVideo?.title ?? 'Video'} onClose={closeModal}>
        {activeVideo ? (
          <div>
            <div className="text-sm text-white/70">
              {activeVideo.views.toLocaleString()} views • {Math.round(activeVideo.durationSeconds / 60)} min
            </div>
            {activeVideo.playbackUrl ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <div className="aspect-video">
                  <iframe
                    className="h-full w-full"
                    src={activeVideo.playbackUrl}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-6">
                <p className="text-white/75">
                  Playback will appear here when a `playbackUrl` is provided by the API. This modal is fully animated and
                  accessible (ESC to close, focus trapped).
                </p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </section>
  );
}


