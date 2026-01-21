import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Ticket, Calendar, ChevronRight, ChevronLeft,
  Filter, X, CheckCircle2, Clock, XCircle, AlertCircle, Eye 
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

interface OrderItem {
  itemType: 'art' | 'event';
  itemId: string;
  title: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: 'created' | 'paid' | 'failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  address?: string;
  phone?: string;
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

interface OrdersResponse {
  orders: Order[];
  pagination: PaginationData;
}

// ─────────────────────────────────────────────────────────────
// Status Badge Component
// ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Order['paymentStatus'] }) {
  const config = {
    paid: {
      icon: CheckCircle2,
      label: 'Paid',
      className: 'bg-green-100 text-green-700',
    },
    created: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700',
    },
    failed: {
      icon: XCircle,
      label: 'Failed',
      className: 'bg-red-100 text-red-700',
    },
  };

  const { icon: Icon, label, className } = config[status] || config.created;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Order Card Component
// ─────────────────────────────────────────────────────────────

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const hasEvents = order.items.some(i => i.itemType === 'event');
  const hasArt = order.items.some(i => i.itemType === 'art');
  const orderDate = new Date(order.createdAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <div className="p-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold">Order #{order._id.slice(-8).toUpperCase()}</h3>
                <StatusBadge status={order.paymentStatus} />
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-(--color-muted)">
                <Calendar className="h-4 w-4" />
                {orderDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-(--color-primary-red)">
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-(--color-muted)">
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          {/* Items Preview */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {order.items.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-black/5 px-2 py-1 text-xs"
                >
                  {item.itemType === 'event' ? (
                    <Ticket className="h-3 w-3 text-(--color-primary-red)" />
                  ) : (
                    <Package className="h-3 w-3 text-(--color-primary-gold)" />
                  )}
                  <span className="max-w-[150px] truncate">{item.title}</span>
                  <span className="text-(--color-muted)">×{item.quantity}</span>
                </span>
              ))}
              {order.items.length > 3 && (
                <span className="inline-flex items-center rounded-lg bg-black/5 px-2 py-1 text-xs text-(--color-muted)">
                  +{order.items.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
            <div className="flex items-center gap-3">
              {hasEvents && (
                <span className="flex items-center gap-1 text-xs text-(--color-muted)">
                  <Ticket className="h-4 w-4" />
                  Event Tickets
                </span>
              )}
              {hasArt && (
                <span className="flex items-center gap-1 text-xs text-(--color-muted)">
                  <Package className="h-4 w-4" />
                  Artwork
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClick}>
              <Eye className="h-4 w-4" />
              View Details
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Order Detail Modal
// ─────────────────────────────────────────────────────────────

function OrderDetailModal({ 
  orderId, 
  onClose 
}: { 
  orderId: string; 
  onClose: () => void;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [tickets, setTickets] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const resp = await apiClient.get<{ order: Order; tickets: unknown[] }>(`/orders/my-orders/${orderId}`);
        setOrder(resp.data?.order || null);
        setTickets(resp.data?.tickets || []);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-black/10 bg-white p-5">
          <h2 className="text-lg font-extrabold">Order Details</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
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
          ) : order ? (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-(--color-muted)">Order ID</p>
                  <p className="font-bold">#{order._id.slice(-8).toUpperCase()}</p>
                </div>
                <StatusBadge status={order.paymentStatus} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-(--color-muted)">Date</p>
                  <p className="font-semibold">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-(--color-muted)">Payment ID</p>
                  <p className="font-semibold truncate">
                    {order.razorpayPaymentId || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="mb-3 font-bold">Items</h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-black/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                          {item.itemType === 'event' ? (
                            <Ticket className="h-5 w-5 text-(--color-primary-red)" />
                          ) : (
                            <Package className="h-5 w-5 text-(--color-primary-gold)" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">{item.title}</p>
                          <p className="text-sm text-(--color-muted)">
                            ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tickets */}
              {tickets.length > 0 && (
                <div>
                  <h3 className="mb-3 font-bold">Event Tickets</h3>
                  <Link to="/my-tickets">
                    <div className="flex items-center justify-between rounded-xl border border-(--color-primary-gold) bg-(--color-primary-gold)/10 p-4">
                      <div className="flex items-center gap-3">
                        <Ticket className="h-6 w-6 text-(--color-primary-red)" />
                        <div>
                          <p className="font-bold">{tickets.length} {tickets.length === 1 ? 'Ticket' : 'Tickets'}</p>
                          <p className="text-sm text-(--color-muted)">Click to view your tickets</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Link>
                </div>
              )}

              {/* Delivery Info */}
              {order.address && (
                <div>
                  <h3 className="mb-3 font-bold">Delivery Address</h3>
                  <div className="rounded-xl bg-black/5 p-4">
                    <p className="text-sm">{order.address}</p>
                    {order.phone && (
                      <p className="mt-2 text-sm text-(--color-muted)">Phone: {order.phone}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between rounded-xl bg-(--color-primary-red) p-4 text-white">
                <span className="font-bold">Total Paid</span>
                <span className="text-2xl font-extrabold">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Orders Page Component
// ─────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const [orders, setOrders] = useState<Order[]>([]);
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/orders');
    }
  }, [isAuthenticated, navigate]);

  const fetchOrders = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (statusFilter) params.set('status', statusFilter);

      const resp = await apiClient.get<OrdersResponse>(`/orders/my-orders?${params.toString()}`);
      setOrders(resp.data?.orders || []);
      setPagination(resp.data?.pagination || pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders(1);
    }
  }, [fetchOrders, isAuthenticated]);

  const handlePageChange = (newPage: number) => {
    fetchOrders(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageTransition>
      <section className="min-h-screen bg-(--color-bg)">
        {/* Hero */}
        <div className="bg-gradient-to-br from-(--color-primary-red) to-[#8B2E2F] py-12 text-white">
          <div className="lux-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">My Orders</h1>
              <p className="mt-2 text-white/80">Track and manage all your purchases</p>
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
              {['', 'paid', 'created', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    statusFilter === status
                      ? 'bg-(--color-primary-red) text-white'
                      : 'bg-white text-(--color-text) hover:bg-black/5'
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
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-white" />
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
                  <p className="font-semibold text-red-800">Unable to load orders</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => fetchOrders(1)}>
                Try Again
              </Button>
            </motion.div>
          ) : orders.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-black/5">
                <Package className="h-12 w-12 text-(--color-muted)" />
              </div>
              <h3 className="text-xl font-extrabold">No orders yet</h3>
              <p className="mt-2 max-w-sm text-(--color-muted)">
                {statusFilter 
                  ? 'No orders match your current filter. Try a different status.'
                  : 'Start exploring our art gallery and events to place your first order.'}
              </p>
              <div className="mt-6 flex gap-3">
                {statusFilter && (
                  <Button variant="ghost" onClick={() => setStatusFilter('')}>
                    Clear Filter
                  </Button>
                )}
                <Button variant="gold" onClick={() => navigate('/art')}>
                  Browse Art
                </Button>
                <Button variant="red" onClick={() => navigate('/events')}>
                  View Events
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Orders List */
            <>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {orders.map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      onClick={() => setSelectedOrderId(order._id)}
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

        {/* Order Detail Modal */}
        <AnimatePresence>
          {selectedOrderId && (
            <OrderDetailModal
              orderId={selectedOrderId}
              onClose={() => setSelectedOrderId(null)}
            />
          )}
        </AnimatePresence>
      </section>
    </PageTransition>
  );
}
