import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/shared/Modal';
import { Spinner } from '@/components/shared/Spinner';
import { FloatingCart } from '@/components/shared/FloatingCart';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useUIStore } from '@/store/useUIStore';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

const Home = lazy(() => import('@/pages/Home'));
const Events = lazy(() => import('@/pages/Events'));
const EventDetail = lazy(() => import('@/pages/EventDetail'));
const EventCheckout = lazy(() => import('@/pages/EventCheckout'));
const TalkShow = lazy(() => import('@/pages/TalkShow'));
const About = lazy(() => import('@/pages/About'));
const Gallery = lazy(() => import('@/pages/Gallery'));
const Auth = lazy(() => import('@/pages/Auth'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const BlogEditorPage = lazy(() => import('@/pages/AdminDashboard_Blogs').then(module => ({ default: module.BlogEditorPage })));
const Art = lazy(() => import('@/pages/Art'));
const ArtDetail = lazy(() => import('@/pages/ArtDetail'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Orders = lazy(() => import('@/pages/Orders'));
const MyTickets = lazy(() => import('@/pages/MyTickets'));
const Profile = lazy(() => import('@/pages/Profile'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogDetail = lazy(() => import('@/pages/BlogDetail'));

import { AdminRoute } from '@/routes/AdminRoute';

function AppShell() {
  useScrollToTop();
  const location = useLocation();
  const { isModalOpen, modalContent, closeModal } = useUIStore();
  
  // Hide header for admin pages
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-(--color-background) text-(--color-text)">
      {!isAdminPage && <Header />}
      <main className={isAdminPage ? "" : ""}>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex min-h-[60vh] items-center justify-center">
              <Spinner size="lg" />
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/event-checkout/:id" element={<EventCheckout />} />
              <Route path="/art" element={<Art />} />
              <Route path="/art/:id" element={<ArtDetail />} />
              <Route path="/talkshow" element={<TalkShow />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              <Route path="/catalog" element={<Navigate to="/blog" replace />} />
              <Route path="/purchase" element={<Checkout />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth initialTab="login" />} />
              <Route path="/signup" element={<Auth initialTab="signup" />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/blogs/new" element={<BlogEditorPage />} />
                <Route path="/admin/blogs/:blogId" element={<BlogEditorPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
        </ErrorBoundary>
      </main>
      {!isAdminPage && <Footer />}

      {/* Floating Cart Button */}
      {!isAdminPage && <FloatingCart />}

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {modalContent}
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
