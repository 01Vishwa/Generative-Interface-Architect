"use client";

/**
 * Fallback Card Component
 * 
 * Renders raw JSON data for unknown chart types.
 * Ensures the dashboard never crashes from unexpected descriptor types.
 */

import { AlertTriangle } from "lucide-react";

interface FallbackCardProps {
  data: Record<string, unknown>;
  index?: number;
}

export default function FallbackCard({ data, index = 0 }: FallbackCardProps) {
  return (
    <div className="chart-card fallback-card" style={{ animationDelay: `${index * 100}ms` }}>
      <h3 className="chart-title">
        <AlertTriangle size={16} style={{ marginRight: 8, color: "var(--color-warning)" }} />
        Unknown Component Type
      </h3>
      <div className="fallback-content">
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
