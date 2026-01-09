import { Button } from '@/components/shared/Button';
import { useAdminStore } from '@/store/useAdminStore';

export default function AdminDashboardPage() {
  const { logoutAdmin } = useAdminStore();

  return (
    <section className="bg-[var(--color-bg)]">
      <div className="lux-container py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="mt-3 text-[var(--color-muted)]">Admin-only area.</p>
          </div>
          <Button variant="ghost" onClick={logoutAdmin}>
            Logout
          </Button>
        </div>

        <div className="mt-8 rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6">
          <div className="text-lg font-extrabold tracking-tight text-[var(--color-text)]">Ready</div>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            This is the protected admin area. Next, we can add events/videos/users management.
          </p>
        </div>
      </div>
    </section>
  );
}
