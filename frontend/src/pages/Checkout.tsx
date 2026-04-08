import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CreditCard, MapPin, Phone, User, Mail, Shield, Lock, 
  CheckCircle2, AlertCircle, ArrowLeft, Package
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
  const { items, clearCart } = useCartStore();
  const { isAuthenticated, user } = useUserStore();
  
  // Form State
  const [name, setName] = useState<string>(String(user?.name || ''));
  const [email, setEmail] = useState<string>(String(user?.email || ''));
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address';
    if (!phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) errors.phone = 'Enter a valid 10-digit phone number';
    
    // Address is required for art purchases
    if (!address.trim()) errors.address = 'Delivery address is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onCheckout = async () => {
    if (!validateForm()) return;
    
    setError('');
    setLoading(true);
    
    try {
      const fullAddress = `${address}${city ? `, ${city}` : ''}${pincode ? ` - ${pincode}` : ''}`;

      // 1. Create art order on backend
      const resp = await apiClient.post('/art-orders/create', {
        items: items.map((it) => ({ 
          artId: it.artId, 
          quantity: it.qty, 
          frameSize: it.size,
        })),
        shippingAddress: fullAddress,
        phone: phone.replace(/\s/g, ''),
      });
      
      const { orderId, keyId, amountInPaise, currency } = resp.data as {
        orderId: string;
        keyId: string;
        amountInPaise: number;
        currency: string;
      };

      // Note: Art orders don't have reconcile endpoint yet, payment verification handles it

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
            const verify = await apiClient.post('/art-orders/verify', {
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
            });
            
            if (verify.data?.success) {
              setSuccess(true);
              clearCart();
              setTimeout(() => {
                navigate('/orders');
              }, 3000);
            }
          } catch (err) {
            const message = getApiErrorMessage(err);

            setError(message);
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
              <h1 className="text-3xl font-extrabold tracking-tight">Payment Successful!</h1>
              <p className="mt-3 text-(--color-muted)">
                Thank you for your purchase. Your order has been confirmed and you will receive a confirmation email shortly.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button variant="gold" onClick={() => navigate('/orders')}>
                  View My Orders
                </Button>
                <Button variant="ghost" onClick={() => navigate('/art')}>
                  Continue Shopping
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </PageTransition>
    );
  }

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
              to="/art" 
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-(--color-muted) hover:text-(--color-text)"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Checkout</h1>
            <p className="mt-2 text-(--color-muted)">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <User className="h-5 w-5 text-(--color-red)" />
                  </div>
                  <div>
                    <h2 className="font-bold">Contact Information</h2>
                    <p className="text-sm text-(--color-muted)">We'll use this to send your order confirmation</p>
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

              {/* Delivery Address */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <MapPin className="h-5 w-5 text-(--color-red)" />
                  </div>
                  <div>
                    <h2 className="font-bold">Delivery Address</h2>
                    <p className="text-sm text-(--color-muted)">Where should we deliver your artwork?</p>
                  </div>
                </div>

                <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-(--color-muted)">
                        Street Address *
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder=""
                        rows={3}
                        className={`w-full rounded-xl border bg-white p-4 text-sm transition-all focus:outline-none focus:ring-2 ${
                          formErrors.address 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-black/4 focus:border-red-200 focus:ring-(--color-red)/20'
                        }`}
                      />
                      {formErrors.address && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-(--color-muted)">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder=""
                          className="h-12 w-full rounded-xl border border-black/4 bg-white px-4 text-sm transition-all focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-(--color-muted)">
                          PIN Code
                        </label>
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 6) {
                              setPincode(value);
                            }
                          }}
                          placeholder=""
                          maxLength={6}
                          className="h-12 w-full rounded-xl border border-black/4 bg-white px-4 text-sm transition-all focus:border-red-200 focus:outline-none focus:ring-2 focus:ring-(--color-red)/20"
                        />
                      </div>
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
                  <div className="mt-4 max-h-75 space-y-4 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-6 w-6 text-(--color-muted)" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold leading-tight line-clamp-2">{item.name}</p>
                          {item.size && (
                            <p className="mt-0.5 text-xs text-(--color-muted)">Size: {item.size}</p>
                          )}
                          <p className="mt-1 text-sm text-(--color-muted)">
                            ₹{item.price.toLocaleString('en-IN')} × {item.qty}
                          </p>
                        </div>
                        <div className="text-right font-semibold">
                          ₹{(item.price * item.qty).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="my-4 border-t border-black/4" />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-(--color-muted)">Subtotal</span>
                      <span className="font-semibold">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-(--color-muted)">Taxes & Fees</span>
                      <span className="font-semibold text-green-600">Included</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-(--color-muted)">Shipping</span>
                      <span className="font-semibold text-green-600">Free</span>
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
                    disabled={loading || items.length === 0}
                  >
                    {loading ? (
                      <>
                        <Spinner className="h-5 w-5" />
                        Processing...
                      </>
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
