import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/shared/Modal';
import { Spinner } from '@/components/shared/Spinner';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useUIStore } from '@/store/useUIStore';

const Home = lazy(() => import('@/pages/Home'));
const Events = lazy(() => import('@/pages/Events'));
const EventDetail = lazy(() => import('@/pages/EventDetail'));
const TalkShow = lazy(() => import('@/pages/TalkShow'));
const Purchase = lazy(() => import('@/pages/Purchase'));
const About = lazy(() => import('@/pages/About'));
const Auth = lazy(() => import('@/pages/Auth'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const Art = lazy(() => import('@/pages/Art'));
const ArtDetail = lazy(() => import('@/pages/ArtDetail'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Orders = lazy(() => import('@/pages/Orders'));
const MyTickets = lazy(() => import('@/pages/MyTickets'));

import { AdminRoute } from '@/routes/AdminRoute';

function AppShell() {
  useScrollToTop();
  const location = useLocation();
  const { isModalOpen, modalContent, closeModal } = useUIStore();
  
  // Hide header for admin pages
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-(--color-bg) text-(--color-text)">
      {!isAdminPage && <Header />}
      <main className={isAdminPage ? "" : "pt-16"}>
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
              <Route path="/art" element={<Art />} />
              <Route path="/art/:id" element={<ArtDetail />} />
              <Route path="/talkshow" element={<TalkShow />} />
              <Route path="/purchase" element={<Purchase />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/my-tickets" element={<MyTickets />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth initialTab="login" />} />
              <Route path="/signup" element={<Auth initialTab="signup" />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
      <Footer />

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
