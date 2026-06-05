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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
              label={x_label ? { value: x_label, position: "bottom", offset: 0, fill: "rgba(255,255,255,0.5)", fontSize: 11 } : undefined}
              tick={{ fill: "rgba(255,255,255,0.6)" }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
              label={y_label ? { value: y_label, angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.5)", fontSize: 11 } : undefined}
              tick={{ fill: "rgba(255,255,255,0.6)" }}
              tickFormatter={(v: number) => {
                if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                return v.toString();
              }}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15, 15, 30, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
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
