import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("HoneyGuard UI Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f4f5fb] flex items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white/90 backdrop-blur-xl border border-purple-200 rounded-2xl p-8 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Application Error Encountered</h2>
            <p className="text-xs text-slate-500 font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 break-words text-left">
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-all inline-flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload HoneyGuard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
