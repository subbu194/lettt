import { TalkShowVideos } from '@/components/home/TalkShowVideos';

export default function TalkShowPage() {
  return (
    <div className="bg-[var(--color-bg)]">
      <div className="lux-container py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight">Talk Show</h1>
          <p className="mt-3 text-[var(--color-muted)]">   conversations and performances — curated for a   experience.</p>
        </div>
      </div>
      <TalkShowVideos />
    </div>
  );
}
