import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Calendar, ChevronRight, ChevronLeft,
  Filter, X, CheckCircle2, Clock, XCircle, AlertCircle, Eye,
  Truck, MapPin, Phone, CreditCard, ShoppingBag, Box, Sparkles
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

interface ArtOrderItem {
  artId: string;
  title: string;
  artist: string;
  image: string;
  quantity: number;
  unitPrice: number;
  frameSize?: string;
}

interface ArtOrder {
  _id: string;
  orderNumber: string;
  items: ArtOrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  orderStatus: 'created' | 'paid' | 'failed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress: string;
  phone: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
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
  orders: ArtOrder[];
  pagination: PaginationData;
}

// ─────────────────────────────────────────────────────────────
// Status Badge Component
// ─────────────────────────────────────────────────────────────

function OrderStatusBadge({ status }: { status: ArtOrder['orderStatus'] }) {
  const config: Record<string, { icon: typeof CheckCircle2; label: string; className: string }> = {
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
    processing: {
      icon: Package,
      label: 'Processing',
      className: 'bg-blue-100 text-blue-700',
    },
    shipped: {
      icon: Truck,
      label: 'Shipped',
      className: 'bg-purple-100 text-purple-700',
    },
    delivered: {
      icon: CheckCircle2,
      label: 'Delivered',
      className: 'bg-emerald-100 text-emerald-700',
    },
    cancelled: {
      icon: XCircle,
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-700',
    },
    refunded: {
      icon: CreditCard,
      label: 'Refunded',
      className: 'bg-orange-100 text-orange-700',
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
// Order Progress Tracker
// ─────────────────────────────────────────────────────────────

function OrderProgress({ status }: { status: ArtOrder['orderStatus'] }) {
  const steps = ['paid', 'processing', 'shipped', 'delivered'];
  const currentIndex = steps.indexOf(status);
  const isActive = currentIndex >= 0;

  if (!isActive || status === 'failed' || status === 'cancelled' || status === 'refunded') {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </motion.div>
                <span className={`mt-2 text-xs font-semibold capitalize ${
                  isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`mx-2 h-0.5 flex-1 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Order Card Component
// ─────────────────────────────────────────────────────────────

function OrderCard({ order, onClick }: { order: ArtOrder; onClick: () => void }) {
  const orderDate = new Date(order.createdAt);
  const firstItem = order.items[0];

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
        <div className="flex flex-col sm:flex-row">
          {/* Image Preview */}
          <div className="relative h-40 w-full overflow-hidden sm:h-auto sm:w-40">
            {firstItem?.image ? (
              <img
                src={firstItem.image}
                alt={firstItem.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
            )}
            {order.items.length > 1 && (
              <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white">
                +{order.items.length - 1} more
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-extrabold text-gray-900">{order.orderNumber}</h3>
                  <OrderStatusBadge status={order.orderStatus} />
                </div>
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {orderDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-gray-900">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>

            {/* Items Preview */}
            <div className="mt-4 flex flex-wrap gap-2">
              {order.items.slice(0, 2).map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium"
                >
                  <span className="max-w-32 truncate">{item.title}</span>
                  <span className="text-gray-400">×{item.quantity}</span>
                </span>
              ))}
              {order.items.length > 2 && (
                <span className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-500">
                  +{order.items.length - 2} more
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between pt-4">
              {order.trackingNumber && (
                <span className="flex items-center gap-1.5 text-xs text-purple-600">
                  <Truck className="h-4 w-4" />
                  {order.trackingNumber}
                </span>
              )}
              <Button variant="ghost" size="sm" className="ml-auto">
                <Eye className="h-4 w-4" />
                View Details
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modern E-commerce Order Detail Modal
// ─────────────────────────────────────────────────────────────

function OrderDetailModal({ 
  orderId, 
  onClose 
}: { 
  orderId: string; 
  onClose: () => void;
}) {
  const [order, setOrder] = useState<ArtOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const resp = await apiClient.get<{ order: ArtOrder }>(`/art-orders/my-orders/${orderId}`);
        setOrder(resp.data?.order || null);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="max-h-[92vh] w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-sm text-gray-500">Loading order details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8">
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-red-50 p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-gray-900">{error}</p>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : order ? (
          <div className="flex flex-col">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-8 text-white">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Order</p>
                  <h2 className="text-xl font-bold">{order.orderNumber}</h2>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <OrderStatusBadge status={order.orderStatus} />
                <p className="text-sm text-white/60">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <OrderProgress status={order.orderStatus} />
            </div>

            {/* Content */}
            <div className="max-h-[50vh] overflow-y-auto p-6">
              {/* Items */}
              <div className="mb-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                  <Box className="h-4 w-4" />
                  Items ({order.items.length})
                </h3>
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-4 rounded-2xl bg-gray-50 p-4"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-center">
                        <p className="font-bold text-gray-900 line-clamp-1">{item.title}</p>
                        <p className="text-sm text-gray-500">by {item.artist}</p>
                        {item.frameSize && (
                          <p className="mt-1 text-xs text-gray-400">Size: {item.frameSize}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                          <span className="font-bold text-gray-900">
                            ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </h3>
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                  <p className="text-sm text-gray-700">{order.shippingAddress}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-4 w-4" />
                    {order.phone}
                  </div>
                </div>
              </div>

              {/* Tracking Info */}
              {order.trackingNumber && (
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                    <Truck className="h-4 w-4" />
                    Tracking
                  </h3>
                  <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                    <p className="font-mono text-sm font-bold text-purple-700">{order.trackingNumber}</p>
                    {order.shippedAt && (
                      <p className="mt-2 text-xs text-gray-500">
                        Shipped on {new Date(order.shippedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold">₹{order.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className={`font-semibold ${order.shippingFee === 0 ? 'text-green-600' : ''}`}>
                      {order.shippingFee === 0 ? 'Free' : `₹${order.shippingFee.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-xl font-black text-gray-900">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {order.razorpayPaymentId && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Payment Successful</span>
                  </div>
                  <span className="font-mono text-xs text-green-600">
                    {order.razorpayPaymentId.slice(-12)}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-6">
              <button
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-4 text-sm font-bold text-white transition-all hover:bg-gray-800"
              >
                <Sparkles className="h-4 w-4" />
                Continue Shopping
              </button>
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Art Orders Page Component
// ─────────────────────────────────────────────────────────────

export default function ArtOrdersPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  const [orders, setOrders] = useState<ArtOrder[]>([]);
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

      const resp = await apiClient.get<OrdersResponse>(`/art-orders/my-orders?${params.toString()}`);
      setOrders(resp.data?.orders || []);
      setPagination(p => resp.data?.pagination || p);
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

  const statusOptions = ['', 'paid', 'processing', 'shipped', 'delivered', 'failed'];

  return (
    <PageTransition>
      <section className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black py-16 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-red-600/20 blur-[120px]" />
          <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
          
          <div className="lux-container relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
                <ShoppingBag className="h-4 w-4" />
                My Orders
              </span>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Art <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">Orders</span>
              </h1>
              <p className="mt-2 text-white/60">Track your artwork purchases and deliveries</p>
            </motion.div>
          </div>
        </div>

        <div className="lux-container py-8">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-500">Filter:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
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
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-white" />
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
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">No orders yet</h3>
              <p className="mt-2 max-w-sm text-gray-500">
                {statusFilter 
                  ? 'No orders match your current filter. Try a different status.'
                  : 'Start exploring our art gallery to place your first order.'}
              </p>
              <div className="mt-6 flex gap-3">
                {statusFilter && (
                  <Button variant="ghost" onClick={() => setStatusFilter('')}>
                    Clear Filter
                  </Button>
                )}
                <Button variant="gold" onClick={() => navigate('/art')}>
                  <Sparkles className="h-4 w-4" />
                  Browse Art
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
                  <span className="text-sm text-gray-500">
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
