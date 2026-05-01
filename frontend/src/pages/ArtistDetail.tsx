import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, MessageCircle, Calendar, Award, MapPin, Star, Share2, Heart } from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { PageTransition } from '@/components/shared/PageTransition';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Spinner } from '@/components/shared/Spinner';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Artist {
  _id: string;
  name: string;
  image?: string;
  artType: string;
  grade: string;
  phone: string;
  whatsapp: string;
  bio?: string;
  featured?: boolean;
  isActive?: boolean;
  createdAt: string;
}

interface ArtistResponse {
  item: Artist;
}

interface ArtItem {
  _id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  isAvailable?: boolean;
  quantity?: number;
}

interface ArtResponse {
  items: ArtItem[];
}

// ─────────────────────────────────────────────────────────────
// Main ArtistDetail Page Component
// ─────────────────────────────────────────────────────────────

export default function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<ArtItem[]>([]);
  const [artworksLoading, setArtworksLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArtist = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const resp = await apiClient.get<ArtistResponse>(`/artists/${id}`);
        setArtist(resp.data?.item || null);
      } catch (err) {
        console.error('Failed to fetch artist:', err);
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [id]);

  useEffect(() => {
    const fetchArtworks = async () => {
      if (!id || !artist) return;
      setArtworksLoading(true);
      try {
        console.log('Fetching artworks for artist:', artist.name);
        // Fetch artworks by this artist using the search parameter (which searches in artist field)
        const resp = await apiClient.get<ArtResponse>(`/art?search=${encodeURIComponent(artist.name)}&limit=10`);
        console.log('Fetched artworks:', resp.data);
        setArtworks(resp.data?.items || []);
      } catch (err) {
        console.error('Failed to fetch artworks:', err);
        // Don't set error state here as it's not critical for the main artist detail
      } finally {
        setArtworksLoading(false);
      }
    };

    fetchArtworks();
  }, [id, artist]);

  const handleBookNow = () => {
    // Open WhatsApp with pre-filled message
    const message = encodeURIComponent(`Hi ${artist?.name}! I'm interested in booking/commissioning your art. Please share more details about your services.`);
    window.open(`https://wa.me/${artist?.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${artist?.phone}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hi ${artist?.name}! I saw your profile and would like to connect.`);
    window.open(`https://wa.me/${artist?.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const backToArtists = () => {
    navigate('/artists');
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-(--color-background) flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PageTransition>
    );
  }

  if (error || !artist) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-(--color-background)">
          <div className="lux-container py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl font-extrabold text-(--color-soft-black) mb-4">Artist Not Found</h1>
              <p className="text-(--color-muted) mb-8">{error || 'The artist you are looking for does not exist.'}</p>
              <Button onClick={backToArtists}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Artists
              </Button>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section className="min-h-screen bg-(--color-background)">
        {/* Header Section */}
        <div className="bg-linear-to-b from-gray-50 to-white border-b border-black/4">
          <div className="lux-container py-8">
            <button
              onClick={backToArtists}
              className="inline-flex items-center text-sm font-semibold text-(--color-muted) hover:text-(--color-red) transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Artists
            </button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              {/* Left: Image */}
              <div className="flex-shrink-0">
                <div className="aspect-square w-full max-w-sm mx-auto lg:max-w-none overflow-hidden rounded-3xl bg-linear-to-br from-black/5 to-black/10 shadow-2xl">
                  {artist.image ? (
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-8xl opacity-20">👤</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Info */}
              <div className="flex-1">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {artist.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-(--color-red)">
                      <Star className="h-3 w-3" />
                      Featured Artist
                    </span>
                  )}
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-(--color-muted)">
                    {artist.artType}
                  </span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    Grade: {artist.grade}
                  </span>
                </div>

                {/* Name */}
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-(--color-soft-black) mb-4">
                  {artist.name}
                </h1>

                {/* Bio */}
                {artist.bio && (
                  <p className="text-lg text-(--color-muted) leading-relaxed mb-6 max-w-2xl">
                    {artist.bio}
                  </p>
                )}

                {/* Contact Info */}
                <div className="grid gap-4 sm:grid-cols-2 mb-8">
                  <button
                    onClick={handleCall}
                    className="flex items-center gap-3 rounded-xl border-2 border-black/8 bg-white p-4 hover:border-red-200 hover:shadow-md transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 group-hover:bg-green-100 transition-colors">
                      <Phone className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-(--color-muted) uppercase tracking-wider">Call</p>
                      <p className="font-bold text-(--color-soft-black)">{artist.phone}</p>
                    </div>
                  </button>

                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center gap-3 rounded-xl border-2 border-black/8 bg-white p-4 hover:border-green-200 hover:shadow-md transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 group-hover:bg-green-100 transition-colors">
                      <MessageCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-(--color-muted) uppercase tracking-wider">WhatsApp</p>
                      <p className="font-bold text-(--color-soft-black)">{artist.whatsapp}</p>
                    </div>
                  </button>
                </div>

                {/* Book Now Button */}
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onClick={handleBookNow}>
                    <Calendar className="h-5 w-5 mr-2" />
                    Book Now
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleWhatsApp}>
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Message on WhatsApp
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="lux-container py-12">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Art Type */}
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                  <Award className="h-7 w-7 text-(--color-red)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-muted)">Art Type</p>
                  <p className="text-xl font-bold text-(--color-soft-black)">{artist.artType}</p>
                </div>
              </div>
            </Card>

            {/* Grade */}
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                  <Award className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-(--color-muted)">Grade</p>
                  <p className="text-xl font-bold text-(--color-soft-black)">{artist.grade}</p>
                </div>
              </div>
            </Card>

            {/* Status */}
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full ${artist.isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className={`h-3 w-3 rounded-full ${artist.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-(--color-muted)">Status</p>
                  <p className="text-xl font-bold text-(--color-soft-black)">
                    {artist.isActive ? 'Available' : 'Unavailable'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

         {/* Artist's Artworks Section */}
         {artist && (
           <div className="py-12">
             <div className="lux-container">
               <h2 className="text-2xl font-extrabold text-(--color-soft-black) mb-6">{artist.name}'s Artworks</h2>
               {!artworksLoading && artworks.length === 0 ? (
                 <p className="text-(--color-muted) text-center">No artworks available</p>
               ) : (
                 <>
                   {artworksLoading ? (
                     <div className="flex justify-center py-8">
                       <Spinner size="sm" />
                     </div>
                   ) : (
                     <div className="overflow-x-auto space-x-4">
                       <div className="flex space-x-4">
                         {artworks.map((artwork) => (
                           <motion.div
                             key={artwork._id}
                             initial={{ opacity: 0, x: 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ duration: 0.5 }}
                             className="flex-shrink-0 w-64"
                           >
                             <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                               {/* Image */}
                               <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                 {artwork.images && artwork.images.length > 0 ? (
                                   <img
                                     src={artwork.images[0]}
                                     alt={artwork.title}
                                     className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                     onError={(e) => {
                                       e.target.onerror = null;
                                       e.target.src = "https://via.placeholder.com/400x300?placeholder=Artwork";
                                     }}
                                   />
                                 ) : (
                                   <div className="flex h-full items-center justify-center">
                                     <span className="text-4xl opacity-30">🎨</span>
                                   </div>
                                 )}
                               </div>

                               {/* Content */}
                               <div className="p-4">
                                 <h3 className="text-lg font-semibold line-clamp-2 mb-2">{artwork.title}</h3>
                                 <p className="text-xs text-(--color-muted) mb-2">
                                   {artwork.description?.substring(0, 100)}${artwork.description?.length > 100 ? '...' : ''}
                                 </p>
                                 <div className="flex items-center justify-between text-sm text-(--color-muted)">
                                   <span>
                                     <MapPin className="h-3 w-3 mr-1" /> 
                                     {artwork.isAvailable !== false ? 'Available' : 'Sold'}
                                   </span>
                                   <span>
                                     {artwork.price > 0 ? (
                                       <>
                                         <Star className="h-3 w-3 mr-1 text-(--color-red)" />
                                         ${artwork.price}
                                       </>
                                     ) : (
                                       <span className="italic">Price on request</span>
                                     )}
                                   </span>
                                 </div>
                               </div>
                             </Card>
                           </motion.div>
                         ))}
                       </div>
                     </div>
                   )}
                 </>
               )}
             </div>
           </div>
         )}

         {/* Related Artists Section */}
         <div className="bg-gray-50 py-12">
           <div className="lux-container">
             <h2 className="text-2xl font-extrabold text-(--color-soft-black) mb-6">Other Artists You May Like</h2>
             <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-black/8">
               <p className="text-(--color-muted)">Related artists will be shown here</p>
             </div>
           </div>
         </div>
       </section>
     </PageTransition>
   );
 }
