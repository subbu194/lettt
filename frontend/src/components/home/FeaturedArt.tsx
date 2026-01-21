import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { SkeletonCard } from '@/components/shared/Skeleton';

type ArtLike = Record<string, unknown>;

export function FeaturedArt() {
  const [items, setItems] = useState<ArtLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="w-full px-4 py-16 sm:px-6">
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
              const artist = String(art.artist ?? '');
              
              return (
                <Link 
                  key={id} 
                  to={`/art/${id}`}
                  className="group rounded-2xl border border-black/10 bg-white p-5 transition-all hover:shadow-lg hover:border-black/20"
                >
                  {image && (
                    <div className="mb-4 aspect-square overflow-hidden rounded-xl">
                      <img 
                        src={image} 
                        alt={title} 
                        className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                      />
                    </div>
                  )}
                  <div className="text-lg font-extrabold tracking-tight line-clamp-1">{title}</div>
                  {artist && (
                    <div className="mt-1 text-sm text-black/60">by {artist}</div>
                  )}
                  <div className="mt-2 text-lg font-bold text-(--color-primary-red)">
                    ₹{price.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-(--color-primary-red) group-hover:underline">
                    View Details →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
