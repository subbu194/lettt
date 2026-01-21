import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CreditCard, MapPin, Phone, User, Mail, Shield, Lock, 
  CheckCircle2, AlertCircle, ArrowLeft, Package, Ticket, Trash2
} from 'lucide-react';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { PageTransition } from '@/components/shared/PageTransition';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Spinner } from '@/components/shared/Spinner';
import { useCartStore } from '@/store/useCartStore';
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
  address?: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, removeItem, clearCart } = useCartStore();
  const { isAuthenticated, user } = useUserStore();
  
  // Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [step, setStep] = useState<'details' | 'payment'>('details');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/checkout');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (items.length === 0 && !success) {
      navigate('/art');
    }
  }, [items, success, navigate]);

  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const hasEvents = items.some(it => it.itemType === 'event');
  const hasArt = items.some(it => it.itemType === 'art');

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address';
    if (!phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) errors.phone = 'Enter a valid 10-digit phone number';
    
    if (hasArt) {
      if (!address.trim()) errors.address = 'Delivery address is required for art purchases';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onCheckout = async () => {
    if (!validateForm()) return;
    
    setError('');
    setLoading(true);
    
    try {
      const fullAddress = hasArt 
        ? `${address}${city ? `, ${city}` : ''}${pincode ? ` - ${pincode}` : ''}`
        : '';

      // 1. Create order on backend
      const resp = await apiClient.post('/orders/create', {
        items: items.map((it) => ({ 
          itemType: it.itemType ?? 'art', 
          itemId: it.id, 
          title: it.name, 
          quantity: it.qty, 
          price: it.price 
        })),
        address: fullAddress,
        phone: phone.replace(/\s/g, ''),
      });
      
      const { orderId, keyId } = resp.data as { orderId: string; keyId: string };

      // 2. Ensure Razorpay script
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Failed to load payment gateway. Please try again.');

      // 3. Open Razorpay checkout
      const rz = new (window as { Razorpay: new (config: unknown) => { open: () => void } }).Razorpay({
        key: keyId,
        order_id: orderId,
        name: 'Let The Talent Talk',
        description: `Payment for ${items.length} ${items.length === 1 ? 'item' : 'items'}`,
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
            setLoading(true);
            const verify = await apiClient.post('/orders/verify', {
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
              items: items.map((it) => ({ 
                itemType: it.itemType ?? 'art', 
                itemId: it.id, 
                title: it.name, 
                quantity: it.qty, 
                price: it.price 
              })),
              address: fullAddress,
              phone: phone.replace(/\s/g, ''),
            });
            
            if (verify.data?.success) {
              setSuccess(true);
              clearCart();
              setTimeout(() => {
                navigate('/orders');
              }, 3000);
            }
          } catch (err) {
            setError(getApiErrorMessage(err));
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
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
      setLoading(false);
    }
  };

  // Success State
  if (success) {
    return (
      <PageTransition>
        <section className="min-h-[70vh] bg-[var(--color-bg)]">
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
              <h1 className="text-3xl font-extrabold tracking-tight">Payment Successful!</h1>
              <p className="mt-3 text-[var(--color-muted)]">
                Thank you for your purchase. Your order has been confirmed and you will receive a confirmation email shortly.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button variant="gold" onClick={() => navigate('/orders')}>
                  View My Orders
                </Button>
                {hasEvents && (
                  <Button variant="ghost" onClick={() => navigate('/my-tickets')}>
                    View My Tickets
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section className="min-h-screen bg-[var(--color-bg)]">
        <div className="lux-container py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link 
              to="/art" 
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Checkout</h1>
            <p className="mt-2 text-[var(--color-muted)]">
              Complete your purchase securely
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-red)]/10">
                    <User className="h-5 w-5 text-[var(--color-primary-red)]" />
                  </div>
                  <div>
                    <h2 className="font-bold">Contact Information</h2>
                    <p className="text-sm text-[var(--color-muted)]">We'll use this to send your order confirmation</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[var(--color-muted)]">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted)]" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm transition-all focus:outline-none focus:ring-2 ${
                          formErrors.name 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-black/10 focus:border-[var(--color-primary-gold)] focus:ring-[var(--color-primary-gold)]/20'
                        }`}
                      />
                    </div>
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[var(--color-muted)]">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted)]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm transition-all focus:outline-none focus:ring-2 ${
                          formErrors.email 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-black/10 focus:border-[var(--color-primary-gold)] focus:ring-[var(--color-primary-gold)]/20'
                        }`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-[var(--color-muted)]">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted)]" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className={`h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-sm transition-all focus:outline-none focus:ring-2 ${
                          formErrors.phone 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-black/10 focus:border-[var(--color-primary-gold)] focus:ring-[var(--color-primary-gold)]/20'
                        }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Delivery Address - Only for Art purchases */}
              {hasArt && (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-gold)]/20">
                      <MapPin className="h-5 w-5 text-[var(--color-primary-red)]" />
                    </div>
                    <div>
                      <h2 className="font-bold">Delivery Address</h2>
                      <p className="text-sm text-[var(--color-muted)]">Where should we deliver your artwork?</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[var(--color-muted)]">
                        Street Address *
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House/Flat no., Building name, Street name"
                        rows={3}
                        className={`w-full rounded-xl border bg-white p-4 text-sm transition-all focus:outline-none focus:ring-2 ${
                          formErrors.address 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-black/10 focus:border-[var(--color-primary-gold)] focus:ring-[var(--color-primary-gold)]/20'
                        }`}
                      />
                      {formErrors.address && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[var(--color-muted)]">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Mumbai"
                          className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm transition-all focus:border-[var(--color-primary-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[var(--color-muted)]">
                          PIN Code
                        </label>
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="400001"
                          maxLength={6}
                          className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-sm transition-all focus:border-[var(--color-primary-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-gold)]/20"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Event Ticket Info */}
              {hasEvents && !hasArt && (
                <Card className="border-[var(--color-primary-gold)]/30 bg-[var(--color-primary-gold)]/5 p-6">
                  <div className="flex items-start gap-3">
                    <Ticket className="h-5 w-5 flex-shrink-0 text-[var(--color-primary-red)]" />
                    <div>
                      <h3 className="font-bold">Digital Tickets</h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        Your event tickets will be sent to your email and available in your account after payment.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">Payment Error</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Right: Order Summary (1 col) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="sticky top-24">
                <Card className="p-6">
                  <h2 className="text-lg font-extrabold tracking-tight">Order Summary</h2>
                  
                  {/* Items */}
                  <div className="mt-4 max-h-[300px] space-y-4 overflow-y-auto">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.itemType}`} className="flex gap-3">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-black/5">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              {item.itemType === 'event' ? (
                                <Ticket className="h-6 w-6 text-[var(--color-muted)]" />
                              ) : (
                                <Package className="h-6 w-6 text-[var(--color-muted)]" />
                              )}
                            </div>
                          )}
                          <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 py-0.5 text-[8px] font-bold uppercase text-white">
                            {item.itemType}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold leading-tight line-clamp-2">{item.name}</p>
                          <p className="mt-1 text-sm text-[var(--color-muted)]">
                            ₹{item.price.toLocaleString('en-IN')} × {item.qty}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <span className="font-bold">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-[var(--color-muted)] hover:text-[var(--color-primary-red)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="my-4 border-t border-black/10" />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-muted)]">Subtotal</span>
                      <span className="font-semibold">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-muted)]">Taxes & Fees</span>
                      <span className="font-semibold text-green-600">Included</span>
                    </div>
                    {hasArt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-muted)]">Shipping</span>
                        <span className="font-semibold text-green-600">Free</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-black/5 p-4">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-extrabold text-[var(--color-primary-red)]">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Pay Button */}
                  <Button
                    variant="gold"
                    size="lg"
                    className="mt-6 w-full"
                    onClick={onCheckout}
                    disabled={loading || items.length === 0}
                    loading={loading}
                  >
                    {loading ? (
                      'Processing...'
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Pay ₹{total.toLocaleString('en-IN')}
                      </>
                    )}
                  </Button>

                  {/* Security Badges */}
                  <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[var(--color-muted)]">
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
                    <p className="text-xs text-[var(--color-muted)]">Powered by Razorpay</p>
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
