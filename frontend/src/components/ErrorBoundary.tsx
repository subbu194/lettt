import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : 'Unexpected error' };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // Production apps should forward this to observability (Sentry, etc.)
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg text-fg flex items-center justify-center p-6">
          <div className="max-w-lg w-full glass rounded-2xl p-6">
            <h1 className="text-2xl font-semibold tracking-wide">Something went wrong</h1>
            <p className="mt-2 text-white/70">{this.state.message}</p>
            <button
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 font-semibold text-fg hover:brightness-110 transition"
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


