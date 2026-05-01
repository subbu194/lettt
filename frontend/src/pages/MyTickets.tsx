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
  coverImage?: string;
  startTime?: string;
  description?: string;
  ticketPrice?: number;
}

interface BookingInfo {
  _id: string;
  bookingNumber: string;
  totalAmount: number;
  bookingStatus: string;
  createdAt: string;
}

interface TicketData {
  _id: string;
  ticketId: string;
  eventId: EventInfo;
  quantity: number;
  status: 'active' | 'used' | 'cancelled' | 'expired';
  effectiveStatus?: 'active' | 'used' | 'cancelled' | 'expired';
  orderId: string | BookingInfo;
  createdAt: string;
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
            {event?.coverImage ? (
              <img
                src={event.coverImage}
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
              <TicketStatusBadge status={ticket.effectiveStatus || ticket.status} />
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
// Modern Gen-Z Style Ticket Detail Modal
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
  const isUpcoming = eventDate ? eventDate > new Date() : false;
  const daysUntilEvent = eventDate ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative max-h-[95vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-sm text-gray-500">Loading your ticket...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8">
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-red-50 p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : ticket ? (
          <div className="flex flex-col max-h-[95vh]">
            {/* Close Button - Fixed */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Hero Image Section - Fixed Height */}
            <div className="relative h-48 sm:h-64 shrink-0 overflow-hidden">
              {event?.coverImage ? (
                <>
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-600 via-red-700 to-red-900">
                  <Ticket className="h-20 w-20 text-white/30" />
                </div>
              )}
              
              {/* Status Badge - Floating */}
              <div className="absolute left-4 top-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <TicketStatusBadge status={ticket.effectiveStatus || ticket.status} />
                </motion.div>
              </div>

              {/* Event Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white drop-shadow-lg">
                    {event?.title || 'Event'}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      <Ticket className="h-3 w-3" />
                      {ticket.ticketId}
                    </span>
                    {isUpcoming && (ticket.effectiveStatus || ticket.status) === 'active' && daysUntilEvent > 0 && (
                      <span className="inline-flex items-center rounded-full bg-green-500/90 px-3 py-1 text-xs font-bold text-white">
                        {daysUntilEvent === 1 ? '🔥 Tomorrow!' : `⏰ ${daysUntilEvent} days to go`}
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Event Details Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {eventDate && (
                    <>
                      <div className="rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                          <Calendar className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</p>
                        <p className="mt-1 text-sm font-bold text-gray-900">
                          {eventDate.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Time</p>
                        <p className="mt-1 text-sm font-bold text-gray-900">
                          {event?.startTime || eventDate.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Guests</p>
                    <p className="mt-1 text-xl font-black text-gray-900">{ticket.quantity}</p>
                  </div>
                </motion.div>

                {/* Venue */}
                {event?.venue && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mt-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                        <MapPin className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Venue</p>
                        <p className="mt-1 text-sm font-bold text-gray-900">{event.venue}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* QR Code Section */}
                {(ticket.effectiveStatus || ticket.status) === 'active' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 flex flex-col sm:flex-row items-center gap-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-6"
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-32 w-32 sm:h-36 sm:w-36 items-center justify-center rounded-2xl bg-white shadow-lg">
                        <QrCode className="h-20 w-20 sm:h-24 sm:w-24 text-gray-800" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow-lg"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </motion.div>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-lg font-bold text-gray-900">Scan at Entry</p>
                      <p className="mt-1 text-sm text-gray-500">Show this QR code to event staff for entry</p>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Entry Pass Valid
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Purchase Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500"
                >
                  <span>Purchased {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    #{typeof ticket.orderId === 'string' ? ticket.orderId.slice(-8).toUpperCase() : (ticket.orderId as BookingInfo).bookingNumber}
                  </span>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  <button className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-200">
                    <Download className="h-4 w-4" />
                    Save
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-200">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  {event?._id && (
                    <Link to={`/events/${event._id}`} onClick={onClose} className="col-span-2">
                      <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition-all hover:shadow-xl hover:shadow-red-500/30">
                        <Maximize2 className="h-4 w-4" />
                        View Event
                      </button>
                    </Link>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        ) : null}
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
      setPagination(p => resp.data?.pagination || p);
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
