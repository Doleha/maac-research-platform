'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-8 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            </div>
            <p className="mb-4 text-gray-600">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <div className="mb-4 rounded-lg bg-red-50 p-4">
                <p className="text-sm font-mono text-red-900">{this.state.error.message}</p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
