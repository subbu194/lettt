import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2, CheckCircle2, MapPin, Phone } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useUserStore } from '@/store/useUserStore';

function digitsOnly(v: string, maxLen: number) {
  const d = v.replace(/\D/g, '');
  return d.length <= maxLen ? d : d.slice(0, maxLen);
}

export function CompleteProfile() {
  const { setUser } = useUserStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const redirectAfterComplete = () => {
    const redirectTo = searchParams.get('redirect') || '/';
    navigate(redirectTo, { replace: true });
  };

  const onSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = { phone, address, city, pincode };

      const resp = await apiClient.post<{ user: Record<string, unknown> }>('/auth/complete-profile', body);
      const next = resp.data?.user as { isProfileComplete?: boolean } | undefined;
      if (resp.data?.user) {
        setUser(resp.data.user);
      }

      if (next?.isProfileComplete) {
        redirectAfterComplete();
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-8 bg-white/70 backdrop-blur-xl border border-black/4 shadow-2xl shadow-black/5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-(--color-soft-black) text-center">
            Finish your profile
          </h2>
          <p className="mt-2 text-sm text-(--color-soft-black)/60 text-center max-w-md mx-auto">
            Add your phone and delivery address to enable checkout and orders.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.form
            key="details"
            className="mt-8 space-y-5"
            onSubmit={onSubmitDetails}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="relative">
              <Phone
                className={`absolute left-4 top-1/2 -translate-y-1/2 ${
                  focusedField === 'phone' ? 'text-(--color-red)' : 'text-(--color-muted)'
                }`}
                size={18}
              />
              <input
                className="peer h-14 w-full rounded-xl border border-black/15 bg-white/70 pl-12 pr-4 pt-5 pb-1 text-(--color-soft-black) outline-none transition-all duration-200 hover:border-black/25 focus:border-red-200 focus:shadow-lg focus:shadow-(--color-red)/10"
                value={phone}
                onChange={(e) => setPhone(digitsOnly(e.target.value, 12))}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder=" "
                required
              />
              <label className="pointer-events-none absolute left-12 top-4 text-sm text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-(--color-red)">
                Mobile Number
              </label>
            </div>

            <div className="relative">
              <MapPin
                className={`absolute left-4 top-4 ${
                  focusedField === 'address' ? 'text-(--color-red)' : 'text-(--color-muted)'
                }`}
                size={18}
              />
              <textarea
                className="peer w-full rounded-xl border border-black/15 bg-white/70 pl-12 pr-4 pt-4 pb-2 text-(--color-soft-black) outline-none transition-all duration-200 hover:border-black/25 focus:border-red-200 focus:shadow-lg focus:shadow-(--color-red)/10 min-h-[88px] resize-none"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => setFocusedField('address')}
                onBlur={() => setFocusedField(null)}
                placeholder="House / street, area"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input
                  className="peer h-14 w-full rounded-xl border border-black/15 bg-white/70 px-4 pt-5 pb-1 text-(--color-soft-black) outline-none transition-all duration-200 hover:border-black/25 focus:border-red-200 focus:shadow-lg focus:shadow-(--color-red)/10"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => setFocusedField('city')}
                  onBlur={() => setFocusedField(null)}
                  type="text"
                  autoComplete="address-level2"
                  placeholder=" "
                />
                <label className="pointer-events-none absolute left-4 top-4 text-sm text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-(--color-red)">
                  City (optional)
                </label>
              </div>
              <div className="relative">
                <input
                  className="peer h-14 w-full rounded-xl border border-black/15 bg-white/70 px-4 pt-5 pb-1 text-(--color-soft-black) outline-none transition-all duration-200 hover:border-black/25 focus:border-red-200 focus:shadow-lg focus:shadow-(--color-red)/10"
                  value={pincode}
                  onChange={(e) => setPincode(digitsOnly(e.target.value, 6))}
                  onFocus={() => setFocusedField('pincode')}
                  onBlur={() => setFocusedField(null)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder=" "
                />
                <label className="pointer-events-none absolute left-4 top-4 text-sm text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-(--color-red)">
                  PIN (optional)
                </label>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200/30 bg-(--color-red)/5 px-4 py-3.5 text-sm flex gap-3">
                <AlertCircle className="text-(--color-red) shrink-0 mt-0.5" size={18} />
                <span>{error}</span>
              </div>
            ) : null}

            <Button variant="red" className="w-full h-14 text-base font-semibold" type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Saving…
                </span>
              ) : (
                'Save and continue'
              )}
            </Button>
          </motion.form>
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
