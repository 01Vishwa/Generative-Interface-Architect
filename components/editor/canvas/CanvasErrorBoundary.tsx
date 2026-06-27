"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Canvas rendering error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 m-4 rounded-xl border-2 border-dashed border-red-200 bg-red-50/50 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <div>
            <h4 className="text-sm font-semibold text-red-600">
              Rendering Error
            </h4>
            <p className="text-xs text-red-500 mt-1 max-w-md break-words">
              {this.state.error?.message || "A component failed to render."}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
