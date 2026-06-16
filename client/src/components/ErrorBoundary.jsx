import React, { Component } from "react";

// ── Base error boundary class ─────────────────────────────────

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary caught]", error, info.componentStack);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      // Allow parent to supply a custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, () => this.reset());
      }
      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={() => this.reset()}
        />
      );
    }
    return this.props.children;
  }
}

// ── Default full-page fallback ────────────────────────────────

function DefaultErrorFallback({ error, onReset }) {
  const isNetworkError = !navigator.onLine;
  const is404          = error?.status === 404;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]
                    px-4 text-center">
      <p className="text-4xl mb-4" role="img" aria-label="Error">
        {isNetworkError ? "📡" : is404 ? "🔍" : "⚠️"}
      </p>
      <h2 className="text-lg font-medium text-gray-800 mb-2">
        {isNetworkError
          ? "No internet connection"
          : is404
            ? "Page not found"
            : "Something went wrong"}
      </h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        {isNetworkError
          ? "Check your connection and try again."
          : is404
            ? "We couldn't find what you were looking for."
            : "An unexpected error occurred. We've been notified."}
      </p>
      {!is404 && (
        <button
          onClick={onReset}
          className="text-sm bg-blue-600 text-white px-5 py-2.5 rounded-xl
                     hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ── Lightweight inline boundary for cards/sections ────────────

export class InlineBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-100 bg-red-50
                        px-4 py-3 text-sm text-red-700">
          {this.props.label || "This section failed to load."}
          <button
            onClick={() => this.setState({ hasError: false })}
            className="ml-2 underline text-red-600 hover:text-red-700"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
