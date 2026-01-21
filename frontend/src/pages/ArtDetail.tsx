import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Heart, Share2, Truck, Shield, Check, ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { PageTransition } from '@/components/shared/PageTransition';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Spinner } from '@/components/shared/Spinner';
import { useCartStore } from '@/store/useCartStore';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ArtItem {
  _id: string;
  title: string;
  description?: string;
  price: number;
  artist?: string;
  category?: string;
  images: string[];
  dimensions?: string;
  frameSizes?: { name: string; width: number; height: number; unit: string }[];
  medium?: string;
  year?: number;
  featured?: boolean;
  available?: boolean;
  isAvailable?: boolean;
  quantity?: number;
}

interface ArtDetailResponse {
  item: ArtItem;
  relatedArt?: ArtItem[];
}

// ─────────────────────────────────────────────────────────────
// Image Gallery Component
// ─────────────────────────────────────────────────────────────

function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setImageLoaded(false);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setImageLoaded(false);
  };

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-black/5 to-black/10">
        <span className="text-6xl opacity-20">🎨</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-black/5 to-black/10">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          )}
          <motion.img
            key={selectedIndex}
            src={images[selectedIndex]}
            alt={`${title} - Image ${selectedIndex + 1}`}
            className={`h-full w-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
          />
          
          {/* Zoom Button */}
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-(--color-text) opacity-0 shadow-lg backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white"
          >
            <ZoomIn className="h-5 w-5" />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-(--color-text) opacity-0 shadow-lg backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-(--color-text) opacity-0 shadow-lg backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedIndex(idx);
                  setImageLoaded(false);
                }}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl transition-all ${
                  idx === selectedIndex
                    ? 'ring-2 ring-(--color-primary-red) ring-offset-2'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setIsZoomed(false)}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={images[selectedIndex]}
              alt={title}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Related Art Card
// ─────────────────────────────────────────────────────────────

function RelatedArtCard({ art }: { art: ArtItem }) {
  return (
    <Link to={`/art/${art._id}`}>
      <Card className="overflow-hidden transition-transform hover:scale-[1.02]">
        <div className="aspect-square overflow-hidden">
          {art.images?.[0] ? (
            <img src={art.images[0]} alt={art.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-black/5">
              <span className="text-3xl opacity-20">🎨</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h4 className="font-bold line-clamp-1">{art.title}</h4>
          <p className="mt-1 text-sm font-semibold text-(--color-primary-red)">
            ₹{art.price.toLocaleString('en-IN')}
          </p>
        </div>
      </Card>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Art Detail Page Component
// ─────────────────────────────────────────────────────────────

export default function ArtDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [art, setArt] = useState<ArtItem | null>(null);
  const [relatedArt, setRelatedArt] = useState<ArtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const fetchArt = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await apiClient.get<ArtDetailResponse>(`/art/${id}`);
        setArt(resp.data?.item ?? null);
        setRelatedArt(resp.data?.relatedArt ?? []);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchArt();
      setAddedToCart(false);
    }
  }, [id]);

  const frameSizes = useMemo(() => {
    if (!art?.frameSizes) return [];
    return art.frameSizes.map(fs => `${fs.name} (${fs.width}x${fs.height}${fs.unit})`);
  }, [art]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const isSoldOut = (art?.quantity !== undefined && art.quantity === 0) || art?.available === false || art?.isAvailable === false;

  useEffect(() => {
    if (frameSizes.length) setSelectedSize(frameSizes[0]);
  }, [frameSizes]);

  const handleAddToCart = () => {
    if (!art || isSoldOut) return;
    addItem({
      id: art._id,
      name: selectedSize ? `${art.title} (${selectedSize})` : art.title,
      price: art.price,
      image: art.images?.[0],
      qty: quantity,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="lux-container py-16">
          <Card className="mx-auto max-w-lg p-8 text-center">
            <div className="mb-4 text-5xl">😢</div>
            <h2 className="text-xl font-extrabold">Unable to load artwork</h2>
            <p className="mt-2 text-(--color-muted)">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button variant="red" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (!art) {
    return (
      <PageTransition>
        <div className="lux-container py-16">
          <Card className="mx-auto max-w-lg p-8 text-center">
            <div className="mb-4 text-5xl">🎨</div>
            <h2 className="text-xl font-extrabold">Artwork not found</h2>
            <p className="mt-2 text-(--color-muted)">This artwork may have been removed or is no longer available.</p>
            <div className="mt-6">
              <Button variant="gold" onClick={() => navigate('/art')}>
                Browse All Artworks
              </Button>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section className="min-h-screen bg-(--color-bg)">
        <div className="lux-container py-8">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-2 text-sm"
          >
            <Link to="/" className="text-(--color-muted) transition-colors hover:text-(--color-text)">
              Home
            </Link>
            <span className="text-(--color-muted)">/</span>
            <Link to="/art" className="text-(--color-muted) transition-colors hover:text-(--color-text)">
              Art Gallery
            </Link>
            <span className="text-(--color-muted)">/</span>
            <span className="font-semibold text-(--color-text) line-clamp-1">{art.title}</span>
          </motion.nav>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left: Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ImageGallery images={art.images || []} title={art.title} />
            </motion.div>

            {/* Right: Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col"
            >
              {/* Category & Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {art.category && (
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-(--color-muted)">
                    {art.category}
                  </span>
                )}
                {art.featured && (
                  <span className="rounded-full bg-(--color-primary-gold) px-3 py-1 text-xs font-bold text-(--color-primary-red)">
                    Featured
                  </span>
                )}
                {isSoldOut && (
                  <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                    Sold Out
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">{art.title}</h1>

              {/* Artist */}
              {art.artist && (
                <p className="mt-2 text-lg text-(--color-muted)">
                  by <span className="font-semibold text-(--color-text)">{art.artist}</span>
                </p>
              )}

              {/* Price */}
              <div className="mt-6">
                <span className="text-4xl font-extrabold text-(--color-primary-red)">
                  ₹{art.price.toLocaleString('en-IN')}
                </span>
                <span className="ml-2 text-sm text-(--color-muted)">Inclusive of all taxes</span>
              </div>

              {/* Description */}
              {art.description && (
                <div className="mt-6">
                  <h3 className="font-bold text-(--color-muted)">Description</h3>
                  <p className="mt-2 leading-relaxed text-(--color-text)">{art.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                {art.dimensions && (
                  <div className="rounded-xl bg-black/5 p-4">
                    <span className="text-xs font-semibold uppercase text-(--color-muted)">Dimensions</span>
                    <p className="mt-1 font-bold">{art.dimensions}</p>
                  </div>
                )}
                {art.medium && (
                  <div className="rounded-xl bg-black/5 p-4">
                    <span className="text-xs font-semibold uppercase text-(--color-muted)">Medium</span>
                    <p className="mt-1 font-bold">{art.medium}</p>
                  </div>
                )}
                {art.year && (
                  <div className="rounded-xl bg-black/5 p-4">
                    <span className="text-xs font-semibold uppercase text-(--color-muted)">Year</span>
                    <p className="mt-1 font-bold">{art.year}</p>
                  </div>
                )}
              </div>

              {/* Frame Size Selector */}
              {frameSizes.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-bold text-(--color-muted)">Frame Size</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {frameSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${
                          selectedSize === size
                            ? 'border-(--color-primary-red) bg-(--color-primary-red)/10 text-(--color-primary-red)'
                            : 'border-black/10 hover:border-black/20'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {!isSoldOut && (
                  <div className="flex items-center rounded-xl border border-black/10 bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-12 w-12 items-center justify-center text-lg font-bold transition-colors hover:bg-black/5"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex h-12 w-12 items-center justify-center text-lg font-bold transition-colors hover:bg-black/5"
                    >
                      +
                    </button>
                  </div>
                )}
                <Button
                  variant="gold"
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isSoldOut || addedToCart}
                >
                  {addedToCart ? (
                    <>
                      <Check className="h-5 w-5" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                    </>
                  )}
                </Button>
                <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-black/10 bg-white transition-colors hover:border-(--color-primary-red) hover:text-(--color-primary-red)">
                  <Heart className="h-5 w-5" />
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-black/10 bg-white transition-colors hover:border-black/20">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-xl bg-black/5 p-4">
                  <Truck className="h-6 w-6 text-(--color-primary-red)" />
                  <div>
                    <p className="text-sm font-bold">Free Shipping</p>
                    <p className="text-xs text-(--color-muted)">On orders over ₹5,000</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-black/5 p-4">
                  <Shield className="h-6 w-6 text-(--color-primary-red)" />
                  <div>
                    <p className="text-sm font-bold">Authenticity</p>
                    <p className="text-xs text-(--color-muted)">Certificate included</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Related Artworks */}
          {relatedArt.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-16"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold tracking-tight">You May Also Like</h2>
                <Link to="/art" className="text-sm font-semibold text-(--color-primary-red) hover:underline">
                  View All →
                </Link>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedArt.slice(0, 4).map((item) => (
                  <RelatedArtCard key={item._id} art={item} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
