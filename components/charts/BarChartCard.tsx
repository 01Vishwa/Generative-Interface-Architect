"use client";

/**
 * Bar Chart Card Component
 * 
 * Wraps Recharts BarChart in a glassmorphic card.
 * Maps the descriptor's labels/values arrays to chart data.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { BarChart as BarChartType } from "@/lib/dashboard-schema";
import { resolveChartColor } from "./chart-utils";

interface BarChartCardProps extends BarChartType {
  index?: number;
}

export default function BarChartCard({
  title,
  labels,
  values,
  color,
  x_label,
  y_label,
  index = 0,
}: BarChartCardProps) {
  const data = labels.map((label, i) => ({
    name: label,
    value: values[i] ?? 0,
  }));

  const palette = resolveChartColor(color, index);

  return (
    <div className="chart-card" style={{ animationDelay: `${index * 100}ms` }}>
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="name"
              stroke="var(--chart-axis)"
              fontSize={11}
              label={x_label ? { value: x_label, position: "bottom", offset: 0, fill: "var(--chart-text)", fontSize: 11 } : undefined}
              tick={{ fill: "var(--chart-text)" }}
            />
            <YAxis
              stroke="var(--chart-axis)"
              fontSize={11}
              label={y_label ? { value: y_label, angle: -90, position: "insideLeft", fill: "var(--chart-text)", fontSize: 11 } : undefined}
              tick={{ fill: "var(--chart-text)" }}
              tickFormatter={(v: number) => {
                if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                return v.toString();
              }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--chart-tooltip-bg)",
                border: `1px solid var(--chart-tooltip-border)`,
                borderRadius: "8px",
                color: "var(--chart-tooltip-text)",
                fontSize: "12px",
              }}
              formatter={(val: number) => [val.toLocaleString(), "Value"]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800}>
              {data.map((_, i) => (
                <Cell key={i} fill={palette[i % palette.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
