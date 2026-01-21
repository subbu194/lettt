import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Users, Ticket, Share2, Heart, 
  ChevronLeft, ChevronRight, X, AlertCircle, Navigation 
} from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { PageTransition } from '@/components/shared/PageTransition';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Spinner } from '@/components/shared/Spinner';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface EventItem {
  _id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  venue?: string;
  ticketPrice: number;
  coverImage?: string;
  galleryImages?: string[];
  seatsAvailable?: number;
  seatsLeft?: number;
  featured?: boolean;
  organizer?: string;
  duration?: string;
  ageRestriction?: string;
}

interface EventDetailResponse {
  item: EventItem;
  relatedEvents?: EventItem[];
}

// ─────────────────────────────────────────────────────────────
// Image Gallery Component
// ─────────────────────────────────────────────────────────────

function ImageGallery({ coverImage, galleryImages, title }: { 
  coverImage?: string; 
  galleryImages?: string[]; 
  title: string;
}) {
  const allImages = [coverImage, ...(galleryImages || [])].filter(Boolean) as string[];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    setImageLoaded(false);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    setImageLoaded(false);
  };

  if (!allImages.length) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-(--color-primary-red)/20 to-(--color-primary-gold)/20">
        <Calendar className="h-20 w-20 text-(--color-primary-red)/30" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="group relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-black/5 to-black/10">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          )}
          <motion.img
            key={selectedIndex}
            src={allImages[selectedIndex]}
            alt={`${title} - Image ${selectedIndex + 1}`}
            className={`h-full w-full object-cover transition-opacity duration-300 cursor-pointer ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onClick={() => setIsZoomed(true)}
          />

          {/* Navigation Arrows */}
          {allImages.length > 1 && (
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
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {selectedIndex + 1} / {allImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedIndex(idx);
                  setImageLoaded(false);
                }}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl transition-all ${
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
              src={allImages[selectedIndex]}
              alt={title}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Related Event Card
// ─────────────────────────────────────────────────────────────

function RelatedEventCard({ event }: { event: EventItem }) {
  const eventDate = new Date(event.date);

  return (
    <Link to={`/events/${event._id}`}>
      <Card className="overflow-hidden transition-transform hover:scale-[1.02]">
        <div className="relative aspect-video overflow-hidden">
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-(--color-primary-red)/10 to-(--color-primary-gold)/10">
              <Calendar className="h-10 w-10 text-(--color-primary-red)/30" />
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-lg bg-white/95 p-2 text-center shadow-md backdrop-blur-sm">
            <span className="block text-lg font-extrabold text-(--color-primary-red)">
              {eventDate.getDate()}
            </span>
            <span className="block text-xs font-semibold uppercase text-(--color-muted)">
              {eventDate.toLocaleDateString('en-US', { month: 'short' })}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h4 className="font-bold line-clamp-1">{event.title}</h4>
          <p className="mt-1 text-sm font-semibold text-(--color-primary-red)">
            ₹{event.ticketPrice.toLocaleString('en-IN')}
          </p>
        </div>
      </Card>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Event Detail Page Component
// ─────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await apiClient.get<EventDetailResponse>(`/events/${id}`);
        setEvent(resp.data?.item ?? null);
        setRelatedEvents(resp.data?.relatedEvents ?? []);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchEvent();
      setQuantity(1);
    }
  }, [id]);

  const handleBookTickets = () => {
    if (!event) return;
    // Navigate to event checkout with event data
    navigate(`/event-checkout/${event._id}`, { 
      state: { 
        event,
        quantity 
      } 
    });
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
            <h2 className="text-xl font-extrabold">Unable to load event</h2>
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

  if (!event) {
    return (
      <PageTransition>
        <div className="lux-container py-16">
          <Card className="mx-auto max-w-lg p-8 text-center">
            <div className="mb-4 text-5xl">🎭</div>
            <h2 className="text-xl font-extrabold">Event not found</h2>
            <p className="mt-2 text-(--color-muted)">This event may have been removed or is no longer available.</p>
            <div className="mt-6">
              <Button variant="gold" onClick={() => navigate('/events')}>
                Browse All Events
              </Button>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const eventDate = new Date(event.date);
  const isUpcoming = eventDate >= new Date();
  const seatsLeft = event.seatsLeft ?? event.seatsAvailable ?? 0;
  const soldOut = seatsLeft <= 0;
  const lowSeats = seatsLeft > 0 && seatsLeft <= 10;
  const maxQuantity = Math.min(seatsLeft, 10);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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
            <Link to="/events" className="text-(--color-muted) transition-colors hover:text-(--color-text)">
              Events
            </Link>
            <span className="text-(--color-muted)">/</span>
            <span className="font-semibold text-(--color-text) line-clamp-1">{event.title}</span>
          </motion.nav>

          <div className="grid gap-12 lg:grid-cols-3">
            {/* Left: Images and Description (2 cols) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2"
            >
              <ImageGallery 
                coverImage={event.coverImage} 
                galleryImages={event.galleryImages} 
                title={event.title} 
              />

              {/* Event Details */}
              <div className="mt-8">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {event.featured && (
                    <span className="rounded-full bg-(--color-primary-gold) px-3 py-1 text-xs font-bold text-(--color-primary-red)">
                      Featured Event
                    </span>
                  )}
                  {!isUpcoming && (
                    <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white">
                      Past Event
                    </span>
                  )}
                  {isUpcoming && soldOut && (
                    <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white">
                      Sold Out
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">{event.title}</h1>

                {/* Organizer */}
                {event.organizer && (
                  <p className="mt-2 text-lg text-(--color-muted)">
                    Organized by <span className="font-semibold text-(--color-text)">{event.organizer}</span>
                  </p>
                )}

                {/* Description */}
                {event.description && (
                  <div className="mt-6">
                    <h3 className="font-bold text-(--color-muted)">About this event</h3>
                    <p className="mt-2 leading-relaxed text-(--color-text) whitespace-pre-line">{event.description}</p>
                  </div>
                )}

                {/* Additional Info */}
                {(event.duration || event.ageRestriction) && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {event.duration && (
                      <div className="rounded-xl bg-black/5 p-4">
                        <span className="text-xs font-semibold uppercase text-(--color-muted)">Duration</span>
                        <p className="mt-1 font-bold">{event.duration}</p>
                      </div>
                    )}
                    {event.ageRestriction && (
                      <div className="rounded-xl bg-black/5 p-4">
                        <span className="text-xs font-semibold uppercase text-(--color-muted)">Age Restriction</span>
                        <p className="mt-1 font-bold">{event.ageRestriction}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right: Booking Card (1 col) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="sticky top-24">
                <Card className="p-6">
                  {/* Date Card */}
                  <div className="mb-6 flex items-center gap-4 rounded-xl bg-gradient-to-br from-(--color-primary-red)/10 to-(--color-primary-gold)/10 p-4">
                    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-white shadow-md">
                      <span className="text-2xl font-extrabold text-(--color-primary-red)">
                        {eventDate.getDate()}
                      </span>
                      <span className="text-xs font-semibold uppercase text-(--color-muted)">
                        {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold">{formatDate(eventDate)}</p>
                      {event.time && (
                        <p className="text-sm text-(--color-muted)">{event.time}</p>
                      )}
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="space-y-4">
                    {event.venue && (
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-(--color-primary-red)" />
                        <div>
                          <p className="font-semibold">{event.venue}</p>
                          <button className="mt-1 flex items-center gap-1 text-sm text-(--color-primary-red) hover:underline">
                            <Navigation className="h-3 w-3" />
                            Get Directions
                          </button>
                        </div>
                      </div>
                    )}

                    {event.time && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 shrink-0 text-(--color-primary-red)" />
                        <p className="font-semibold">{event.time}</p>
                      </div>
                    )}

                    {isUpcoming && (
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 shrink-0 text-(--color-primary-red)" />
                        <p className={`font-semibold ${lowSeats ? 'text-(--color-primary-red)' : ''}`}>
                          {soldOut ? 'No seats available' : `${seatsLeft} seats left`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-6 border-t border-black/10" />

                  {/* Price */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-(--color-muted)">Ticket Price</span>
                    <div>
                      <span className="text-3xl font-extrabold text-(--color-primary-red)">
                        ₹{event.ticketPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="ml-1 text-sm text-(--color-muted)">/ person</span>
                    </div>
                  </div>

                  {/* Low Seats Warning */}
                  {isUpcoming && lowSeats && !soldOut && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-(--color-primary-red)/10 p-3 text-sm text-(--color-primary-red)">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="font-semibold">Only {seatsLeft} seats remaining!</span>
                    </div>
                  )}

                  {/* Quantity & Book */}
                  {isUpcoming && !soldOut && (
                    <>
                      <div className="mt-6">
                        <label className="mb-2 block text-sm font-semibold text-(--color-muted)">
                          Number of Tickets
                        </label>
                        <div className="flex items-center rounded-xl border border-black/10 bg-white">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="flex h-12 w-12 items-center justify-center text-lg font-bold transition-colors hover:bg-black/5"
                          >
                            −
                          </button>
                          <span className="flex-1 text-center font-bold">{quantity}</span>
                          <button
                            onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                            disabled={quantity >= maxQuantity}
                            className="flex h-12 w-12 items-center justify-center text-lg font-bold transition-colors hover:bg-black/5 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="mt-4 flex items-baseline justify-between rounded-xl bg-black/5 p-4">
                        <span className="font-semibold">Total</span>
                        <span className="text-2xl font-extrabold text-(--color-primary-red)">
                          ₹{(event.ticketPrice * quantity).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Book Button */}
                      <Button
                        variant="gold"
                        size="lg"
                        className="mt-6 w-full"
                        onClick={handleBookTickets}
                      >
                        <Ticket className="h-5 w-5" />
                        Book {quantity} {quantity === 1 ? 'Ticket' : 'Tickets'}
                      </Button>
                    </>
                  )}

                  {/* Sold Out / Past Event Message */}
                  {(!isUpcoming || soldOut) && (
                    <div className="mt-6">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="w-full"
                        disabled
                      >
                        {!isUpcoming ? 'Event has ended' : 'Sold Out'}
                      </Button>
                    </div>
                  )}

                  {/* Share & Wishlist */}
                  <div className="mt-6 flex gap-3">
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white p-3 text-sm font-semibold transition-colors hover:border-black/20">
                      <Heart className="h-4 w-4" />
                      Save
                    </button>
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white p-3 text-sm font-semibold transition-colors hover:border-black/20">
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>

          {/* Related Events */}
          {relatedEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-16"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold tracking-tight">More Events You Might Like</h2>
                <Link to="/events" className="text-sm font-semibold text-(--color-primary-red) hover:underline">
                  View All →
                </Link>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedEvents.slice(0, 4).map((item) => (
                  <RelatedEventCard key={item._id} event={item} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
