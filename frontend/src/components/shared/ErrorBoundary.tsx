import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : 'Unexpected error' };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-black/70">{this.state.message}</p>
            <button
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-[var(--color-primary-red)] px-5 py-3 font-semibold text-[var(--color-primary-gold)] glow-gold hover:glow-red transition"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

