"use client";

/**
 * Line Chart Card Component
 * 
 * Wraps Recharts LineChart with area gradient fill in a glassmorphic card.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { LineChart as LineChartType } from "@/lib/dashboard-schema";
import { resolvePrimaryColor } from "./chart-utils";

interface LineChartCardProps extends LineChartType {
  index?: number;
}

export default function LineChartCard({
  title,
  labels,
  values,
  color,
  x_label,
  y_label,
  index = 0,
}: LineChartCardProps) {
  const data = labels.map((label, i) => ({
    name: label,
    value: values[i] ?? 0,
  }));

  const primaryColor = resolvePrimaryColor(color, index);
  const gradientId = `lineGradient_${index}`;

  return (
    <div className="chart-card" style={{ animationDelay: `${index * 100}ms` }}>
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="value"
              stroke={primaryColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              animationDuration={1000}
              dot={{ r: 4, fill: primaryColor, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: primaryColor, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
