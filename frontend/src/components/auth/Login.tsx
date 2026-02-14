import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useUserStore } from '@/store/useUserStore';

type AuthResponse = { token?: string; user?: Record<string, unknown> };

export function Login() {
  const login = useUserStore((s) => s.login);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    
    try {
      const resp = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      const token = resp.data?.token;
      if (!token) {
        setError('Login succeeded but no token was returned.');
        return;
      }
      login(token, resp.data?.user);
      setSuccess(true);
      
      // Redirect to the intended page or home
      const redirectTo = searchParams.get('redirect') || '/';
      setTimeout(() => {
        navigate(redirectTo);
      }, 1000);
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
        {/* Header with stagger animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-(--color-soft-black)">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-(--color-soft-black)/60">
            Sign in to continue to your account
          </p>
        </motion.div>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          {/* Email Input with Icon */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              <Mail 
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  focusedField === 'email' 
                    ? 'text-(--color-red)' 
                    : 'text-(--color-muted)'
                }`}
                size={18}
              />
              <input
                className="peer h-14 w-full rounded-xl border border-black/15 bg-white/70 pl-12 pr-4 pt-5 pb-1 text-(--color-soft-black) outline-none transition-all duration-200 hover:border-black/25 focus:border-red-200 focus:shadow-lg focus:shadow-(--color-red)/10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                type="email"
                autoComplete="email"
                placeholder=" "
                required
              />
              <label className="pointer-events-none absolute left-12 top-4 text-sm text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-(--color-red)">
                Email Address
              </label>
            </div>
          </motion.div>

          {/* Password Input with Icon and Toggle */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <div className="relative">
              <Lock 
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  focusedField === 'password' 
                    ? 'text-(--color-red)' 
                    : 'text-(--color-muted)'
                }`}
                size={18}
              />
              <input
                className="peer h-14 w-full rounded-xl border border-black/15 bg-white/70 pl-12 pr-12 pt-5 pb-1 text-(--color-soft-black) outline-none transition-all duration-200 hover:border-black/25 focus:border-red-200 focus:shadow-lg focus:shadow-(--color-red)/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder=" "
                required
              />
              <label className="pointer-events-none absolute left-12 top-4 text-sm text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-(--color-red)">
                Password
              </label>
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-(--color-muted) hover:text-(--color-text) transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </motion.button>
            </div>
          </motion.div>

          {/* Success Message with Animation */}
          <AnimatePresence mode="wait">
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3.5 text-sm text-(--color-text) flex items-start gap-3">
                  <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-semibold text-green-600">Success!</span>{' '}
                    You've logged in successfully. Redirecting...
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message with Animation */}
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
                    <span className="font-semibold text-(--color-red)">Error:</span>{' '}
                    {error}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button with Loading State */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              <Button 
                variant="red" 
                className="w-full h-14 text-base font-semibold relative overflow-hidden group"
                type="submit" 
                disabled={loading}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Loader2 className="animate-spin" size={20} />
                      <span>Signing in...</span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key="signin"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Sign in
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {/* Animated background on hover */}
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </Button>
            </motion.div>
          </motion.div>
        </form>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <a 
            href="#" 
            className="text-sm text-(--color-red) hover:underline transition-all duration-200 hover:text-(--color-red)/80"
          >
            Forgot your password?
          </a>
        </motion.div>
      </Card>
    </motion.div>
  );
}