"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[SchedulePage Error]", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-8 rounded-2xl border border-rose-500/30 bg-rose-950/20 backdrop-blur-md">
          <h3 className="text-lg font-semibold text-rose-400">Something went wrong</h3>
          <p className="mt-2 text-sm text-zinc-400">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors text-sm font-medium"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
