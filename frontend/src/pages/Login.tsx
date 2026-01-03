import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { usePageMeta } from '../hooks/usePageMeta';
import { useUserStore } from '../store/useStore';

export default function Login() {
  usePageMeta({
    title: 'Login — Let the talent talk',
    description: 'Sign in to access premium community features.',
  });

  const setToken = useUserStore((s) => s.setToken);

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="max-w-md glass rounded-2xl p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
          <p className="mt-2 text-white/70 text-sm">
            Auth UI will be connected to your backend. For now this page only demonstrates the token store.
          </p>
          <div className="mt-5 flex gap-3">
            <Button onClick={() => setToken('demo_token')}>Set Token</Button>
            <Button variant="ghost" onClick={() => setToken(null)}>
              Clear
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}


