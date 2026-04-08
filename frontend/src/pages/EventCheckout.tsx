import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CreditCard, MapPin, Phone, User, Mail, Shield, Lock, 
  CheckCircle2, AlertCircle, ArrowLeft, Ticket, Calendar, Clock
} from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { PageTransition } from '@/components/shared/PageTransition';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Spinner } from '@/components/shared/Spinner';
import { useUserStore } from '@/store/useUserStore';

declare global {
  interface Window { Razorpay: unknown }
}

async function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

interface EventItem {
  _id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  venue?: string;
  ticketPrice: number;
  coverImage?: string;
  seatsLeft?: number;
}

export default function EventCheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useUserStore();
  
  // Event data from navigation state or fetch
  const [event, setEvent] = useState<EventItem | null>(location.state?.event || null);
  const [quantity, setQuantity] = useState<number>(location.state?.quantity || 1);
  const [loading, setLoading] = useState(!event);
  const [fetchError, setFetchError] = useState('');
  
  // Form State
  const [name, setName] = useState<string>((user?.name as string) || '');
  const [email, setEmail] = useState<string>((user?.email as string) || '');
  const [phone, setPhone] = useState<string>('');
  
  // UI State
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/auth?redirect=/event-checkout/${id}`);
    }
  }, [isAuthenticated, navigate, id]);

  // Fetch event if not in state
  useEffect(() => {
    const fetchEvent = async () => {
      if (event || !id) return;
      
      setLoading(true);
      setFetchError('');
      try {
        const resp = await apiClient.get<{ item: EventItem }>(`/events/${id}`);
        setEvent(resp.data?.item ?? null);
      } catch (err) {
        setFetchError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, event]);

  const total = event ? event.ticketPrice * quantity : 0;
  const maxQuantity = event?.seatsLeft ? Math.min(event.seatsLeft, 10) : 10;

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address';
    if (!phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) errors.phone = 'Enter a valid 10-digit phone number';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onCheckout = async () => {
    if (!event || !validateForm()) return;
    
    setError('');
    setPaymentLoading(true);
    
    try {
      // 1. Create ticket booking on backend
      const resp = await apiClient.post('/ticket-bookings/create', {
        eventId: event._id,
        quantity,
        phone: phone.replace(/\s/g, ''),
      });
      
      const { orderId, keyId, amountInPaise, currency } = resp.data as {
        orderId: string;
        keyId: string;
        amountInPaise: number;
        currency: string;
      };

      // Note: Ticket bookings don't have reconcile endpoint yet, payment verification handles it

      // 2. Ensure Razorpay script
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Failed to load payment gateway. Please try again.');

      // 3. Open Razorpay checkout
      const rz = new (window as { Razorpay: new (config: unknown) => { open: () => void } }).Razorpay({
        key: keyId,
        amount: amountInPaise,
        currency,
        order_id: orderId,
        name: 'Let The Talent Talk',
        description: `${event.title} - ${quantity} ${quantity === 1 ? 'Ticket' : 'Tickets'}`,
        prefill: {
          name,
          email,
          contact: phone.replace(/\s/g, ''),
        },
        handler: async (payment: { 
          razorpay_order_id: string; 
          razorpay_payment_id: string; 
          razorpay_signature: string;
        }) => {
          try {
            setPaymentLoading(true);
            const verify = await apiClient.post('/ticket-bookings/verify', {
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
            });
            
            if (verify.data?.success) {
              setSuccess(true);
              setTimeout(() => {
                navigate('/my-tickets');
              }, 3000);
            }
          } catch (err) {
            const message = getApiErrorMessage(err);

            setError(message);
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
        theme: { 
          color: '#CF4647',
          backdrop_color: 'rgba(0,0,0,0.6)',
        },
      });
      
      rz.open();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPaymentLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </PageTransition>
    );
  }

  // Fetch Error
  if (fetchError || !event) {
    return (
      <PageTransition>
        <div className="lux-container py-16">
          <Card className="mx-auto max-w-lg p-8 text-center">
            <div className="mb-4 text-5xl">😢</div>
            <h2 className="text-xl font-extrabold">Unable to load event</h2>
            <p className="mt-2 text-(--color-muted)">{fetchError || 'Event not found'}</p>
            <div className="mt-6">
              <Button variant="gold" onClick={() => navigate('/events')}>
                Browse Events
              </Button>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // Success State
  if (success) {
    return (
      <PageTransition>
        <section className="min-h-[70vh] bg-(--color-background)">
          <div className="lux-container flex items-center justify-center py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
              >
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </motion.div>
              <h1 className="text-3xl font-extrabold tracking-tight">Booking Successful!</h1>
              <p className="mt-3 text-(--color-muted)">
                Your tickets have been confirmed! You will receive them via email shortly.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button variant="gold" onClick={() => navigate('/my-tickets')}>
                  View My Tickets
                </Button>
                <Button variant="ghost" onClick={() => navigate('/events')}>
                  Browse More Events
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </PageTransition>
    );
  }

  const eventDate = new Date(event.date);

  return (
    <PageTransition>
      <section className="min-h-screen bg-(--color-background)">
        <div className="lux-container py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link 
              to={`/events/${event._id}`}
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-(--color-muted) hover:text-(--color-text)"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Event
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Complete Booking</h1>
            <p className="mt-2 text-(--color-muted)">
              Secure your tickets now
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Form (2 cols) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Contact Information */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <User className="h-5 w-5 text-(--color-red)" />
                  </div>
                  <div>
                    <h2 className="font-bold">Contact Information</h2>
                    <p className="text-sm text-(--color-muted)">We'll send your tickets here</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-(--color-muted)">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--color-muted)" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder=""
                        className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm transition-all focus:outline-none focus:ring-2 ${
                          formErrors.name 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-black/4 focus:border-red-200 focus:ring-(--color-red)/20'
                        }`}
                      />
                    </div>
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-(--color-muted)">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--color-muted)" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=""
                        className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm transition-all focus:outline-none focus:ring-2 ${
                          formErrors.email 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-black/4 focus:border-red-200 focus:ring-(--color-red)/20'
                        }`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-(--color-muted)">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--color-muted)" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 10) {
                            setPhone(value);
                          }
                        }}
                        placeholder=""
                        maxLength={10}
                        className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm transition-all focus:outline-none focus:ring-2 ${
                          formErrors.phone 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-black/4 focus:border-red-200 focus:ring-(--color-red)/20'
                        }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Ticket Delivery Info */}
              <Card className="border-red-200/30 bg-red-50/50 p-6">
                <div className="flex items-start gap-3">
                  <Ticket className="h-5 w-5 shrink-0 text-(--color-red)" />
                  <div>
                    <h3 className="font-bold">Digital Tickets</h3>
                    <p className="mt-1 text-sm text-(--color-muted)">
                      Your event tickets will be sent to your email instantly after payment and will be available in your account.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">Payment Error</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Right: Booking Summary (1 col) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="sticky top-24">
                <Card className="p-6">
                  <h2 className="text-lg font-extrabold tracking-tight">Booking Summary</h2>
                  
                  {/* Event Preview */}
                  <div className="mt-4">
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-50">
                      {event.coverImage ? (
                        <img src={event.coverImage} alt={event.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Ticket className="h-12 w-12 text-(--color-muted)" />
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 font-bold line-clamp-2">{event.title}</h3>
                  </div>

                  {/* Event Details */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 shrink-0 text-(--color-red)" />
                      <span className="text-(--color-muted)">
                        {eventDate.toLocaleDateString('en-IN', { 
                          weekday: 'short',
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 shrink-0 text-(--color-red)" />
                        <span className="text-(--color-muted)">{event.time}</span>
                      </div>
                    )}
                    {event.venue && (
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-(--color-red)" />
                        <span className="text-(--color-muted)">{event.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-4 border-t border-black/4" />

                  {/* Quantity Selector */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-(--color-muted)">
                      Number of Tickets
                    </label>
                    <div className="flex items-center rounded-xl border border-black/4 bg-white">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="flex h-12 w-12 items-center justify-center text-lg font-bold transition-colors hover:bg-gray-50"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center font-bold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                        disabled={quantity >= maxQuantity}
                        className="flex h-12 w-12 items-center justify-center text-lg font-bold transition-colors hover:bg-gray-50 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    {event.seatsLeft && event.seatsLeft <= 10 && (
                      <p className="mt-2 text-xs text-(--color-red)">
                        Only {event.seatsLeft} seats left!
                      </p>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-(--color-muted)">Ticket Price</span>
                      <span className="font-semibold">₹{event.ticketPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-(--color-muted)">Quantity</span>
                      <span className="font-semibold">× {quantity}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-(--color-muted)">Taxes & Fees</span>
                      <span className="font-semibold text-green-600">Included</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 p-4">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-extrabold text-(--color-red)">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Pay Button */}
                  <Button
                    variant="gold"
                    size="lg"
                    className="mt-6 w-full"
                    onClick={onCheckout}
                    disabled={paymentLoading}
                    loading={paymentLoading}
                  >
                    {paymentLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Pay ₹{total.toLocaleString('en-IN')}
                      </>
                    )}
                  </Button>

                  {/* Security Badges */}
                  <div className="mt-6 flex items-center justify-center gap-4 text-xs text-(--color-muted)">
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="h-4 w-4" />
                      <span>SSL Encrypted</span>
                    </div>
                  </div>

                  {/* Razorpay Badge */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-(--color-muted)">Powered by Razorpay</p>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
