import { Outlet } from 'react-router-dom';
import { Navbar } from '../nav/Navbar';
import { usePointerGlow } from '../../hooks/usePointerGlow';

export function Shell() {
  usePointerGlow();

  return (
    <div className="min-h-screen bg-bg text-fg">
      <Navbar />
      <main id="main" className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}


