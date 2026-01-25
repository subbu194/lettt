import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { getApiErrorMessage } from '@/api/error';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useUserStore } from '@/store/useUserStore';

type AuthResponse = { token?: string; user?: Record<string, unknown> };

export function Signup() {
  const login = useUserStore((s) => s.login);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const strength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    return score; // 0..4
  })();

  const getStrengthColor = () => {
    if (strength >= 3) return 'var(--color-primary-gold)';
    if (strength === 2) return '#FFA500';
    return 'var(--color-primary-red)';
  };

  const getStrengthText = () => {
    if (strength >= 3) return 'Strong';
    if (strength === 2) return 'Medium';
    return 'Weak';
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!acceptTerms) {
      setError('Please accept the terms to continue.');
      return;
    }
    setLoading(true);
    try {
      const resp = await apiClient.post<AuthResponse>('/auth/signup', { name, email, password });
      const token = resp.data?.token;
      if (!token) {
        setError('Signup succeeded but no token was returned.');
        return;
      }
      login(token, resp.data?.user);
      setSuccess(true);
      
      // Redirect to home after 1.5 seconds
      setTimeout(() => {
        navigate('/');
      }, 1500);
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
      <Card className="p-8 bg-white/70 backdrop-blur-xl border border-black/10 shadow-2xl shadow-black/5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-(--color-text)">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-(--color-muted)">
            Join us today and start your journey
          </p>
        </motion.div>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          {/* Name Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              <User 
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  focusedField === 'name' 
                    ? 'text-(--color-primary-gold)' 
                    : 'text-(--color-muted)'
                }`}
                size={18}
              />
              <input
                className="peer h-14 w-full rounded-xl border border-black/15 bg-white/70 pl-12 pr-4 pt-5 pb-1 text-(--color-text) outline-none transition-all duration-200 hover:border-black/25 focus:border-(--color-primary-gold) focus:shadow-lg focus:shadow-(--color-primary-gold)/10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                type="text"
                autoComplete="name"
                placeholder=" "
                required
              />
              <label className="pointer-events-none absolute left-12 top-4 text-sm text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-(--color-primary-gold)">
                Full Name
              </label>
            </div>
          </motion.div>

          {/* Email Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <div className="relative">
              <Mail 
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  focusedField === 'email' 
                    ? 'text-(--color-primary-gold)' 
                    : 'text-(--color-muted)'
                }`}
                size={18}
              />
              <input
                className="peer h-14 w-full rounded-xl border border-black/15 bg-white/70 pl-12 pr-4 pt-5 pb-1 text-(--color-text) outline-none transition-all duration-200 hover:border-black/25 focus:border-(--color-primary-gold) focus:shadow-lg focus:shadow-(--color-primary-gold)/10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                type="email"
                autoComplete="email"
                placeholder=" "
                required
              />
              <label className="pointer-events-none absolute left-12 top-4 text-sm text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-(--color-primary-gold)">
                Email Address
              </label>
            </div>
          </motion.div>

          {/* Password Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="relative"
          >
            <div className="relative">
              <Lock 
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  focusedField === 'password' 
                    ? 'text-(--color-primary-gold)' 
                    : 'text-(--color-muted)'
                }`}
                size={18}
              />
              <input
                className="peer h-14 w-full rounded-xl border border-black/15 bg-white/70 pl-12 pr-12 pt-5 pb-1 text-(--color-text) outline-none transition-all duration-200 hover:border-black/25 focus:border-(--color-primary-gold) focus:shadow-lg focus:shadow-(--color-primary-gold)/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder=" "
                required
              />
              <label className="pointer-events-none absolute left-12 top-4 text-sm text-(--color-muted) transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-(--color-primary-gold)">
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

          {/* Password Strength Indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-muted) font-medium">Password Strength</span>
              <motion.span
                key={strength}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ color: getStrengthColor() }}
                className="font-semibold"
              >
                {getStrengthText()}
              </motion.span>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i < strength ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="h-2 rounded-full overflow-hidden bg-white/60 border border-black/10"
                  style={{ originX: 0 }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: getStrengthColor() }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: i < strength ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
              ))}
            </div>
            
            <p className="text-xs text-(--color-muted) leading-relaxed">
              Use 8+ characters with uppercase, lowercase, and numbers
            </p>
          </motion.div>

          {/* Terms Checkbox */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <motion.label
              className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/60 px-4 py-4 text-sm text-(--color-text) cursor-pointer transition-all duration-200 hover:bg-white/80 hover:border-black/20"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 appearance-none rounded border-2 border-black/20 bg-white checked:bg-(--color-primary-gold) checked:border-(--color-primary-gold) transition-all duration-200 cursor-pointer"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <CheckCircle2 
                  className="absolute pointer-events-none text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" 
                  size={16}
                />
              </div>
              <span className="leading-relaxed">
                I agree to the{' '}
                <a href="#" className="font-semibold text-(--color-primary-gold) hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-semibold text-(--color-primary-gold) hover:underline">
                  Privacy Policy
                </a>
              </span>
            </motion.label>
          </motion.div>

          {/* Success Message */}
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
                  <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-semibold text-green-600">Account created successfully!</span>{' '}
                    Welcome aboard! Redirecting to home...
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                <div className="rounded-xl border border-(--color-primary-red)/30 bg-(--color-primary-red)/5 px-4 py-3.5 text-sm text-(--color-text) flex items-start gap-3">
                  <AlertCircle className="text-(--color-primary-red) shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-semibold text-(--color-primary-red)">Error:</span>{' '}
                    {error}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              <Button 
                variant="gold" 
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
                      <span>Creating account...</span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key="create"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Create Account
                    </motion.span>
                  )}
                </AnimatePresence>
                
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </Button>
            </motion.div>
          </motion.div>
        </form>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 flex items-center justify-center gap-2 text-xs text-(--color-muted)"
        >
          <Shield size={14} />
          <span>Your data is encrypted and secure</span>
        </motion.div>
      </Card>
    </motion.div>
  );
}