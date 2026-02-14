import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, Calendar, MapPin, Clock, ChevronRight, ChevronLeft, 
  Filter, X, CheckCircle2, XCircle, AlertCircle, QrCode, Users,
  Download, Share2, Maximize2
} from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { PageTransition } from '@/components/shared/PageTransition';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { useUserStore } from '@/store/useUserStore';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface EventInfo {
  _id: string;
  title: string;
  date: string;
  venue: string;
  images?: string[];
}

interface TicketData {
  _id: string;
  ticketId: string;
  eventId: EventInfo;
  quantity: number;
  status: 'active' | 'used' | 'cancelled' | 'expired';
  orderId: string;
  purchasedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface TicketsResponse {
  tickets: TicketData[];
  pagination: PaginationData;
}

// ─────────────────────────────────────────────────────────────
// Status Badge Component
// ─────────────────────────────────────────────────────────────

function TicketStatusBadge({ status }: { status: TicketData['status'] }) {
  const config = {
    active: {
      icon: CheckCircle2,
      label: 'Active',
      className: 'bg-green-100 text-green-700',
    },
    used: {
      icon: Ticket,
      label: 'Used',
      className: 'bg-gray-100 text-gray-700',
    },
    cancelled: {
      icon: XCircle,
      label: 'Cancelled',
      className: 'bg-red-100 text-red-700',
    },
    expired: {
      icon: Clock,
      label: 'Expired',
      className: 'bg-orange-100 text-orange-700',
    },
  };

  const { icon: Icon, label, className } = config[status] || config.active;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Ticket Card Component
// ─────────────────────────────────────────────────────────────

function TicketCard({ ticket, onClick }: { ticket: TicketData; onClick: () => void }) {
  const event = ticket.eventId;
  const eventDate = event?.date ? new Date(event.date) : null;
  const isUpcoming = eventDate ? eventDate > new Date() : false;
  const isPast = eventDate ? eventDate < new Date() : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="flex flex-col md:flex-row">
          {/* Event Image */}
          <div className="relative h-48 w-full overflow-hidden md:h-auto md:w-48">
            {event?.images?.[0] ? (
              <img
                src={event.images[0]}
                alt={event.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-red-700 via-red-600 to-red-700">
                <Ticket className="h-12 w-12 text-white/50" />
              </div>
            )}
            
            {/* Date Badge */}
            {eventDate && (
              <div className="absolute left-3 top-3 rounded-xl bg-white/95 px-2 py-1 text-center shadow-lg backdrop-blur-sm">
                <div className="text-xs font-bold uppercase text-(--color-red)">
                  {eventDate.toLocaleDateString('en-IN', { month: 'short' })}
                </div>
                <div className="text-xl font-extrabold leading-tight">{eventDate.getDate()}</div>
              </div>
            )}
          </div>

          {/* Ticket Details */}
          <div className="flex flex-1 flex-col p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-extrabold leading-tight line-clamp-2">
                  {event?.title || 'Event'}
                </h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-(--color-red)">
                  Ticket #{ticket.ticketId}
                </p>
              </div>
              <TicketStatusBadge status={ticket.status} />
            </div>

            {/* Event Info */}
            <div className="mt-4 space-y-2">
              {eventDate && (
                <div className="flex items-center gap-2 text-sm text-(--color-muted)">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {eventDate.toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {' at '}
                    {eventDate.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              {event?.venue && (
                <div className="flex items-center gap-2 text-sm text-(--color-muted)">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{event.venue}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-(--color-muted)" />
                <span className="text-sm font-semibold">
                  {ticket.quantity} {ticket.quantity === 1 ? 'Guest' : 'Guests'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {ticket.status === 'active' && isUpcoming && (
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-(--color-red)">
                    Upcoming
                  </span>
                )}
                {isPast && ticket.status === 'active' && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">
                    Past
                  </span>
                )}
                <ChevronRight className="h-5 w-5 text-(--color-muted) transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Ticket Detail Modal
// ─────────────────────────────────────────────────────────────

function TicketDetailModal({ 
  ticketId, 
  onClose 
}: { 
  ticketId: string; 
  onClose: () => void;
}) {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const resp = await apiClient.get<{ ticket: TicketData }>(`/tickets/my-tickets/${ticketId}`);
        setTicket(resp.data?.ticket || null);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  const event = ticket?.eventId;
  const eventDate = event?.date ? new Date(event.date) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-black/4 bg-white p-5">
          <h2 className="text-lg font-extrabold">Ticket Details</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          ) : ticket ? (
            <div className="space-y-6">
              {/* Event Image */}
              <div className="relative aspect-video overflow-hidden rounded-xl">
                {event?.images?.[0] ? (
                  <img
                    src={event.images[0]}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-red-700 via-red-600 to-red-700">
                    <Ticket className="h-16 w-16 text-white/50" />
                  </div>
                )}
                <TicketStatusBadge status={ticket.status} />
              </div>

              {/* Event Title */}
              <div>
                <h3 className="text-xl font-extrabold">{event?.title || 'Event'}</h3>
                <p className="mt-1 text-sm text-(--color-muted)">
                  Ticket ID: {ticket.ticketId}
                </p>
              </div>

              {/* Event Details */}
              <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                {eventDate && (
                  <>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-(--color-red)" />
                      <div>
                        <p className="font-semibold">
                          {eventDate.toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-(--color-red)" />
                      <p className="font-semibold">
                        {eventDate.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </>
                )}
                {event?.venue && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-(--color-red)" />
                    <p className="font-semibold">{event.venue}</p>
                  </div>
                )}
              </div>

              {/* Ticket Info */}
              <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-(--color-red)" />
                  <div>
                    <p className="text-sm text-(--color-muted)">Number of Guests</p>
                    <p className="text-2xl font-extrabold">{ticket.quantity}</p>
                  </div>
                </div>
              </div>

              {/* QR Code Placeholder */}
              {ticket.status === 'active' && (
                <div className="flex flex-col items-center rounded-xl bg-white border-2 border-dashed border-black/20 p-6">
                  <div className="mb-3 flex h-32 w-32 items-center justify-center rounded-xl bg-gray-50">
                    <QrCode className="h-16 w-16 text-(--color-muted)" />
                  </div>
                  <p className="text-sm font-semibold">Scan at Entry</p>
                  <p className="text-xs text-(--color-muted)">Show this QR code to the event staff</p>
                </div>
              )}

              {/* Purchase Info */}
              <div className="text-center text-xs text-(--color-muted)">
                <p>Purchased on {new Date(ticket.purchasedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}</p>
                <p>Order: #{ticket.orderId.slice(-8).toUpperCase()}</p>
              </div>

              {/* Actions */}
              {ticket.status === 'active' && (
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="ghost" className="flex-1">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              )}

              {/* View Event Link */}
              {event?._id && (
                <Link to={`/events/${event._id}`}>
                  <Button variant="gold" className="w-full">
                    <Maximize2 className="h-4 w-4" />
                    View Event Details
                  </Button>
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main MyTickets Page Component
// ─────────────────────────────────────────────────────────────

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/my-tickets');
    }
  }, [isAuthenticated, navigate]);

  const fetchTickets = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (statusFilter) params.set('status', statusFilter);

      const resp = await apiClient.get<TicketsResponse>(`/tickets/my-tickets?${params.toString()}`);
      setTickets(resp.data?.tickets || []);
      setPagination(resp.data?.pagination || pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets(1);
    }
  }, [fetchTickets, isAuthenticated]);

  const handlePageChange = (newPage: number) => {
    fetchTickets(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Count tickets by status
  const activeCount = tickets.filter(t => t.status === 'active').length;
  const usedCount = tickets.filter(t => t.status === 'used').length;

  return (
    <PageTransition>
      <section className="min-h-screen bg-(--color-background)">
        {/* Hero */}
        <div className="relative overflow-hidden bg-(--color-soft-black) py-16 text-white">
          <div className="absolute inset-0 dot-pattern opacity-[0.03]" />
          <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-red-600/15 blur-[120px]" />
          <div className="lux-container relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                  <Ticket className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">My <span className="text-gradient-red">Tickets</span></h1>
                  <p className="mt-1 text-white/60">Your event passes & booking confirmations</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              {!loading && tickets.length > 0 && (
                <div className="mt-6 flex gap-4">
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="font-bold">{activeCount} Active</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <Ticket className="h-5 w-5 text-white/60" />
                    <span className="font-bold">{usedCount} Used</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <div className="lux-container py-8">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-(--color-muted)" />
              <span className="text-sm font-semibold text-(--color-muted)">Filter by status:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['', 'active', 'used', 'cancelled', 'expired'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    statusFilter === status
                      ? 'bg-(--color-red) text-white'
                      : 'bg-white text-(--color-text) hover:bg-gray-50'
                  }`}
                >
                  {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-red-200 bg-red-50 p-6"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Unable to load tickets</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => fetchTickets(1)}>
                Try Again
              </Button>
            </motion.div>
          ) : tickets.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-50">
                <Ticket className="h-12 w-12 text-(--color-muted)" />
              </div>
              <h3 className="text-xl font-extrabold">No tickets yet</h3>
              <p className="mt-2 max-w-sm text-(--color-muted)">
                {statusFilter 
                  ? 'No tickets match your current filter. Try a different status.'
                  : 'Book tickets for upcoming events to see them here.'}
              </p>
              <div className="mt-6 flex gap-3">
                {statusFilter && (
                  <Button variant="ghost" onClick={() => setStatusFilter('')}>
                    Clear Filter
                  </Button>
                )}
                <Button variant="red" onClick={() => navigate('/events')}>
                  <Ticket className="h-4 w-4" />
                  Browse Events
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Tickets List */
            <>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {tickets.map((ticket) => (
                    <TicketCard
                      key={ticket._id}
                      ticket={ticket}
                      onClick={() => setSelectedTicketId(ticket._id)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-(--color-muted)">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Ticket Detail Modal */}
        <AnimatePresence>
          {selectedTicketId && (
            <TicketDetailModal
              ticketId={selectedTicketId}
              onClose={() => setSelectedTicketId(null)}
            />
          )}
        </AnimatePresence>
      </section>
    </PageTransition>
  );
}
