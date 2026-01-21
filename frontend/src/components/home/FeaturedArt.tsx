import { useEffect, useState } from 'react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { Button } from '@/components/shared/Button';
import { SkeletonCard } from '@/components/shared/Skeleton';
import { useCartStore } from '@/store/useCartStore';

type ArtLike = Record<string, unknown>;

export function FeaturedArt() {
  const [items, setItems] = useState<ArtLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const fetchArt = async () => {
      try {
        const resp = await apiClient.get<{ items: ArtLike[] }>('/art/featured');
        setItems(resp.data?.items || []);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchArt();
  }, []);

  return (
    <section className="border-t border-black/10 bg-(--color-bg)">
      <div className="lux-container py-16">
        <div className="fade-in">
          <h2 className="text-3xl font-extrabold tracking-tight">Featured Art</h2>
          <p className="mt-2 text-(--color-muted)">Spotlight pieces from emerging and established artists.</p>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 text-sm text-black/70">Error: {error}</div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((art, i) => {
              const id = String(art._id ?? art.id ?? i);
              const title = String(art.title ?? 'Untitled');
              const price = Number(art.price ?? 0);
              const image = Array.isArray(art.images) && art.images.length ? String(art.images[0]) : undefined;
              return (
                <div key={id} className="rounded-2xl border border-black/10 bg-white p-5">
                  {image ? <img src={image} alt={title} className="mb-4 h-40 w-full rounded-xl object-cover" /> : null}
                  <div className="text-lg font-extrabold tracking-tight">{title}</div>
                  <div className="mt-1 text-sm text-black/70">₹ {price}</div>
                  <div className="mt-4">
                    <Button variant="gold" onClick={() => addItem({ id, name: title, price, image, itemType: 'art' })}>Add to Cart</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
