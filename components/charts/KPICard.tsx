"use client";

/**
 * KPI Card Component
 * 
 * Renders a single key performance indicator with glassmorphic styling.
 * Displays label, formatted value, optional delta with trend coloring,
 * and directional arrow icon.
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPI } from "@/lib/dashboard-schema";

interface KPICardProps extends KPI {
  index?: number;
}

export default function KPICard({ label, value, delta, trend, index = 0 }: KPICardProps) {
  const trendColor =
    trend === "up"
      ? "var(--color-success)"
      : trend === "down"
        ? "var(--color-danger)"
        : "var(--color-text-muted)";

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className="kpi-card"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {(delta || trend) && (
        <div className="kpi-delta" style={{ color: trendColor }}>
          <TrendIcon size={14} style={{ marginRight: 4, flexShrink: 0 }} />
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}
