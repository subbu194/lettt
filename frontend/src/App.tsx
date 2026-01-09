import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/shared/Modal';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useUIStore } from '@/store/useUIStore';

const Home = lazy(() => import('@/pages/Home'));
const Events = lazy(() => import('@/pages/Events'));
const TalkShow = lazy(() => import('@/pages/TalkShow'));
const Purchase = lazy(() => import('@/pages/Purchase'));
const About = lazy(() => import('@/pages/About'));
const Auth = lazy(() => import('@/pages/Auth'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));

import { AdminRoute } from '@/routes/AdminRoute';

function AppShell() {
  useScrollToTop();
  const { isModalOpen, modalContent, closeModal } = useUIStore();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header />
      <main className="pt-16">
        <Suspense
          fallback={
            <div className="lux-container py-16">
              <div className="rounded-2xl border border-black/10 bg-[var(--color-bg)] p-6 shadow-sm">Loading…</div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/talkshow" element={<TalkShow />} />
            <Route path="/purchase" element={<Purchase />} />
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
