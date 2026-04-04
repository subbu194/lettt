import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, LogOut, Mail } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Login } from '@/components/auth/Login';
import { Signup } from '@/components/auth/Signup';
import { CompleteProfile } from '@/components/auth/CompleteProfile';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/components/shared/Button';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { PageTransition } from '@/components/shared/PageTransition';

type AuthTab = 'login' | 'signup';

type Props = {
  initialTab?: 'login' | 'signup';
};

export default function AuthPage({ initialTab }: Props) {
  const [tab, setTab] = useState<AuthTab>(initialTab ?? 'login');
  const { isAuthenticated, logout, user } = useUserStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.isProfileComplete) {
        const redirectTo = searchParams.get('redirect') || '/';
        navigate(redirectTo, { replace: true });
      }
    }
  }, [isAuthenticated, user?.isProfileComplete, navigate, searchParams]);

  const handleAuthSuccess = () => {
    if (user?.isProfileComplete) {
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <PageTransition>
      <section className="relative min-h-screen bg-(--color-background)">
        <div className="relative">
          <AuthBackground />
          
          <div className="lux-container py-12 sm:py-16 md:py-20">
            <div className="mx-auto w-full max-w-5xl">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                
                {/* Left Side - Hero Content */}
                <motion.div
                  className="hidden lg:block"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="space-y-8">
                    <div>
                      <h1 className="text-5xl xl:text-6xl font-bold text-(--color-text) leading-tight mb-6">
                        Welcome to{' '}
                        <span className="text-(--color-red)">
                          Let The Talent Talk
                        </span>
                      </h1>
                      <p className="text-xl text-(--color-text-secondary) leading-relaxed">
                        Sign in with your email and password to access your account, 
                        browse events, explore art, and more.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-(--color-red-light) flex items-center justify-center">
                          <Mail className="w-6 h-6 text-(--color-red)" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-(--color-text) mb-1">Email & Password</h3>
                          <p className="text-(--color-text-secondary)">Secure authentication with your email and password</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-(--color-border)">
                      <p className="text-sm text-(--color-text-secondary)">
                        By signing up, you agree to our{' '}
                        <a href="#" className="text-(--color-text) hover:text-(--color-red) font-medium transition-colors">Terms of Service</a>{' '}
                        and{' '}
                        <a href="#" className="text-(--color-text) hover:text-(--color-red) font-medium transition-colors">Privacy Policy</a>
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Right Side - Auth Forms */}
                <motion.div
                  className="w-full max-w-xl mx-auto lg:max-w-none"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  {/* Mobile Hero */}
                  <div className="lg:hidden text-center mb-8">
                    <h1 className="text-4xl font-bold text-(--color-text) mb-4">
                      Welcome to{' '}
                      <span className="text-(--color-red)">
                        Let The Talent Talk
                      </span>
                    </h1>
                    <p className="text-(--color-text-secondary)">
                      Sign in or create an account to get started
                    </p>
                  </div>

                  {/* Auth Card */}
                  <div className="bg-(--color-surface) backdrop-blur-xl rounded-3xl shadow-xl border border-(--color-border) overflow-hidden">
                    
                    {/* Forms Container */}
                    <div className="p-6">
                      {isAuthenticated && !user?.isProfileComplete ? (
                        <motion.div
                          key="complete-profile"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2"
                        >
                          <CompleteProfile />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="email"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Email Auth - Tabbed Interface */}
                          <div className="mt-2">
                            <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
                              <button
                                onClick={() => setTab('login')}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                                  tab === 'login'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                <LogIn size={18} />
                                Sign In
                              </button>
                              <button
                                onClick={() => setTab('signup')}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                                  tab === 'signup'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                <UserPlus size={18} />
                                Sign Up
                              </button>
                            </div>

                            <AnimatePresence mode="wait">
                              {tab === 'login' ? (
                                <motion.div
                                  key="email-login"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                >
                                  <Login onSuccess={handleAuthSuccess} />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="email-signup"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                >
                                  <Signup onSuccess={handleAuthSuccess} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Logout Button */}
                  <AnimatePresence>
                    {isAuthenticated && (
                      <motion.div
                        className="mt-6 text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Button
                          variant="ghost"
                          onClick={logout}
                          className="text-(--color-text-secondary) hover:text-(--color-text)"
                        >
                          <LogOut size={18} className="mr-2" />
                          Sign Out
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Mobile Terms */}
                  <div className="lg:hidden mt-8 text-center">
                    <p className="text-sm text-(--color-text-secondary)">
                      By signing up, you agree to our{' '}
                      <a href="#" className="text-(--color-text) hover:text-(--color-red) font-medium transition-colors">Terms</a>{' '}
                      and{' '}
                      <a href="#" className="text-(--color-text) hover:text-(--color-red) font-medium transition-colors">Privacy</a>
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}