/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white p-6 sm:p-8 border border-red-200 rounded-2xl shadow-sm text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {this.props.fallbackTitle || 'Terjadi Kendala Tampilan'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Halaman ini mengalami kendala saat memproses data tampilan.
              <br />
              <span className="font-mono text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded mt-2 inline-block">
                {this.state.error?.message || 'Unknown render error'}
              </span>
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
