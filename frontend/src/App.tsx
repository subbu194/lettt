import { AnimatePresence } from 'framer-motion';
import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SmoothScrollProvider } from './animations/lenis';
import { PageTransition } from './components/layout/PageTransition';
import { Shell } from './components/layout/Shell';

const Home = lazy(() => import('./pages/Home'));
const Events = lazy(() => import('./pages/Events'));
const TalkShow = lazy(() => import('./pages/TalkShow'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));

function AppRoutes() {
  const location = useLocation();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg text-fg flex items-center justify-center">
          <div className="glass rounded-2xl px-6 py-4 text-white/80">Loading…</div>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<Shell />}>
            <Route
              path="/"
              element={
                <PageTransition>
                  <Home />
                </PageTransition>
              }
            />
            <Route
              path="/events"
              element={
                <PageTransition>
                  <Events />
                </PageTransition>
              }
            />
            <Route
              path="/talk-show"
              element={
                <PageTransition>
                  <TalkShow />
                </PageTransition>
              }
            />
            <Route
              path="/about"
              element={
                <PageTransition>
                  <About />
                </PageTransition>
              }
            />
            <Route
              path="/login"
              element={
                <PageTransition>
                  <Login />
                </PageTransition>
              }
            />
            <Route
              path="*"
              element={
                <PageTransition>
                  <NotFound />
                </PageTransition>
              }
            />
          </Route>
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScrollProvider>
        <AppRoutes />
      </SmoothScrollProvider>
    </BrowserRouter>
  );
}
