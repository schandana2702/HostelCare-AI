import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HostelCare AI Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#150f2e] rounded-3xl border border-purple-500/25 p-8 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white tracking-tight">
                Something went wrong
              </h2>
              <p className="text-xs text-purple-300/70">
                An unexpected interface error occurred. The system safely caught this state.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/25 text-left font-mono text-[11px] text-purple-200 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 btn-primary-purple text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reload Page
              </button>
              <button
                onClick={this.handleHome}
                className="px-4 py-2.5 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/25 text-purple-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Home className="w-3.5 h-3.5" /> Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
