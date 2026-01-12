import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, LogOut, Sparkles } from 'lucide-react';
import { Login } from '@/components/auth/Login';
import { Signup } from '@/components/auth/Signup';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/components/shared/Button';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { PageTransition } from '@/components/shared/PageTransition';
import { fadeInUp } from '@/utils/animations';

type Props = {
  initialTab?: 'login' | 'signup';
};

export default function AuthPage({ initialTab }: Props) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab ?? 'login');
  const { isAuthenticated, logout } = useUserStore();
  const [isChangingTab, setIsChangingTab] = useState(false);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (newTab: 'login' | 'signup') => {
    if (newTab === tab) return;
    setIsChangingTab(true);
    setTimeout(() => {
      setTab(newTab);
      setIsChangingTab(false);
    }, 150);
  };

  return (
    <PageTransition>
      <section className="relative min-h-screen bg-[var(--color-bg)]">
        <div className="relative">
          <AuthBackground />
          
          <div className="lux-container py-12 sm:py-16 md:py-20">
            <div className="mx-auto w-full max-w-xl">
              
              {/* Animated Header */}
              <motion.div
                className="text-center mb-8"
                initial="initial"
                animate="animate"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="inline-flex items-center gap-2 mb-4"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.2 
                  }}
                >
                </motion.div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
                  <span className="animated-gradient-text">Welcome Back</span>
                </h1>
                
                <motion.p
                  className="text-sm md:text-base text-[var(--color-muted)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {tab === 'login' 
                    ? 'Sign in to continue your journey' 
                    : 'Create an account to get started'}
                </motion.p>
              </motion.div>

              {/* Tab Switcher with Enhanced Animation */}
              <motion.div
                className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur-xl p-2 shadow-lg mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="relative grid grid-cols-2 gap-2">
                  {/* Animated Background Slider */}
                  <motion.div
                    className="absolute h-11 rounded-xl bg-[var(--color-text)] shadow-md"
                    initial={false}
                    animate={{
                      x: tab === 'login' ? 0 : '100%',
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                    style={{
                      width: 'calc(50% - 4px)',
                      left: '4px',
                      top: '4px'
                    }}
                  />
                  
                  {/* Login Tab */}
                  <motion.button
                    type="button"
                    className={`relative z-10 h-11 rounded-xl text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${
                      tab === 'login'
                        ? 'text-[var(--color-primary-gold)]'
                        : 'text-[var(--color-text)] hover:text-[var(--color-text)]/80'
                    }`}
                    onClick={() => handleTabChange('login')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogIn size={16} />
                    <span>Login</span>
                  </motion.button>
                  
                  {/* Signup Tab */}
                  <motion.button
                    type="button"
                    className={`relative z-10 h-11 rounded-xl text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${
                      tab === 'signup'
                        ? 'text-[var(--color-primary-gold)]'
                        : 'text-[var(--color-text)] hover:text-[var(--color-text)]/80'
                    }`}
                    onClick={() => handleTabChange('signup')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <UserPlus size={16} />
                    <span>Sign Up</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Form Container with Smooth Transitions */}
              <motion.div
                className="relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  {tab === 'login' ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: -30, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 30, scale: 0.95 }}
                      transition={{ 
                        duration: 0.4,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                    >
                      <Login />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, x: 30, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -30, scale: 0.95 }}
                      transition={{ 
                        duration: 0.4,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                    >
                      <Signup />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Logout Button for Authenticated Users */}
              <AnimatePresence>
                {isAuthenticated && (
                  <motion.div
                    className="mt-6 flex justify-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="ghost" 
                        onClick={logout}
                        className="flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Additional Info Footer */}
              <motion.div
                className="mt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xs text-[var(--color-muted)]">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-[var(--color-primary-gold)] hover:underline">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-[var(--color-primary-gold)] hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}