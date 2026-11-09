import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A101D] text-[#F3EFE8] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#15233A] border border-[#1F3354] rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertCircle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Something went unexpected</h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {this.state.error?.message || 'A temporary interface error occurred. Your workspace data remains safe and saved in the database.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-1/2 py-2.5 px-4 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-1/2 py-2.5 px-4 bg-[#0D1726] hover:bg-[#1A2C4C] text-[#CBD5E1] border border-[#1F3354] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} className="text-[#C8814F]" />
                <span>My Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

