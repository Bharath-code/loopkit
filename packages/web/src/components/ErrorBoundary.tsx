"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">⚠️</span>
        <h3 className="text-base font-semibold text-red-400">
          Something went wrong
        </h3>
      </div>
      <p className="text-sm text-zinc-400 mb-4">
        This dashboard widget failed to load. You can try refreshing the page,
        or contact support if the problem persists.
      </p>
      {error && (
        <details className="text-xs text-zinc-600">
          <summary className="cursor-pointer hover:text-zinc-500">
            Error details
          </summary>
          <pre className="mt-2 p-2 bg-zinc-900 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-3 py-1.5 text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
      >
        Refresh page
      </button>
    </div>
  );
}
