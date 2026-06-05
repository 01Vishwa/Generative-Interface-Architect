"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ChartErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Chart rendering error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <AlertTriangle size={32} style={{ marginBottom: '8px' }} />
          <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Chart Rendering Error</h4>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '0 16px', wordBreak: 'break-all' }}>
            {this.state.error?.message || "An unknown error occurred while rendering this chart."}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
