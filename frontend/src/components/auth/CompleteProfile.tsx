import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2, CheckCircle2, MapPin, Phone, SkipForward } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useUserStore } from '@/store/useUserStore';

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

  const onCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await apiClient.post<{ user: Record<string, unknown> }>('/auth/complete-profile', {
        phone,
        address,
        city,
        pincode,
      });
      if (resp.data?.user) {
        setUser(resp.data.user);
      }
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSkipProfile = () => {
    // Redirect without completing profile
    const redirectTo = searchParams.get('redirect') || '/';
    navigate(redirectTo);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-8 bg-white/70 backdrop-blur-xl border border-black/4 shadow-2xl shadow-black/5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-(--color-soft-black) text-center">
            You're Signed In!
          </h2>
          <p className="mt-2 text-sm text-(--color-soft-black)/60 text-center">
            Complete your profile to get the best experience
          </p>
        </motion.div>

        <form className="mt-8 space-y-5" onSubmit={onCompleteProfile}>
          {/* Phone Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              <Phone 
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  focusedField === 'phone' ? 'text-(--color-red)' : 'text-(--color-muted)'
                }`}
                size={18}
              />
              <input
                className="peer h-14 w-full rounded-xl border border-black/15 bg-white/70 pl-12 pr-4 pt-5 pb-1 text-(--color-soft-black) outline-none transition-all duration-200 hover:border-black/25 focus:border-red-200 focus:shadow-lg focus:shadow-(--color-red)/10"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) setPhone(value);
                }}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                type="tel"
                placeholder=" "
                required
              />
              <label className="pointer-events-none absolute left-12 top-2 text-xs text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-(--color-red)">
                Phone Number
              </label>
            </div>
          </motion.div>

          {/* Address Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <div className="relative">
              <MapPin 
                className={`absolute left-4 top-4 transition-colors duration-200 ${
                  focusedField === 'address' ? 'text-(--color-red)' : 'text-(--color-muted)'
                }`}
                size={18}
              />
              <textarea
                className="peer w-full rounded-xl border border-black/15 bg-white/70 pl-12 pr-4 pt-4 pb-2 text-(--color-soft-black) outline-none transition-all duration-200 hover:border-black/25 focus:border-red-200 focus:shadow-lg focus:shadow-(--color-red)/10 min-h-[80px] resize-none"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => setFocusedField('address')}
                onBlur={() => setFocusedField(null)}
                placeholder="Enter your full address"
                required
              />
            </div>
          </motion.div>

          {/* City and Pincode */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="relative">
              <input
                className="h-14 w-full rounded-xl border border-black/15 bg-white/70 px-4 pt-5 pb-1 text-(--color-soft-black) outline-none transition-all duration-200 hover:border-black/25 focus:border-red-200 focus:shadow-lg focus:shadow-(--color-red)/10 peer"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onFocus={() => setFocusedField('city')}
                onBlur={() => setFocusedField(null)}
                type="text"
                placeholder=" "
                required
              />
              <label className="pointer-events-none absolute left-4 top-2 text-xs text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-(--color-red)">
                City
              </label>
            </div>
            <div className="relative">
              <input
                className="h-14 w-full rounded-xl border border-black/15 bg-white/70 px-4 pt-5 pb-1 text-(--color-soft-black) outline-none transition-all duration-200 hover:border-black/25 focus:border-red-200 focus:shadow-lg focus:shadow-(--color-red)/10 peer"
                value={pincode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) setPincode(value);
                }}
                onFocus={() => setFocusedField('pincode')}
                onBlur={() => setFocusedField(null)}
                type="text"
                placeholder=" "
                required
              />
              <label className="pointer-events-none absolute left-4 top-2 text-xs text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-(--color-red)">
                PIN Code
              </label>
            </div>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-red-200/30 bg-(--color-red)/5 px-4 py-3.5 text-sm text-(--color-soft-black) flex items-start gap-3">
                  <AlertCircle className="text-(--color-red) shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-semibold text-(--color-red)">Error:</span> {error}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button 
              variant="red" 
              className="w-full h-14 text-base font-semibold"
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Saving...
                </span>
              ) : (
                'Complete Profile'
              )}
            </Button>

            <button
              type="button"
              onClick={onSkipProfile}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-(--color-muted) hover:text-(--color-text) transition-colors"
            >
              <SkipForward size={16} />
              Skip for now
            </button>
          </motion.div>
        </form>
      </Card>
    </motion.div>
  );
}
