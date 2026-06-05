"use client";

/**
 * Scatter Chart Card Component
 * 
 * Wraps Recharts ScatterChart with glassmorphic styling.
 */

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ScatterChart as ScatterChartType } from "@/lib/dashboard-schema";
import { resolvePrimaryColor } from "./chart-utils";

interface ScatterChartCardProps extends ScatterChartType {
  index?: number;
}

export default function ScatterChartCard({
  title,
  x_values,
  y_values,
  color,
  x_label,
  y_label,
  index = 0,
}: ScatterChartCardProps) {
  const data = x_values.map((x, i) => ({
    x,
    y: y_values[i] ?? 0,
  }));

  const primaryColor = resolvePrimaryColor(color, index);

  return (
    <div className="chart-card" style={{ animationDelay: `${index * 100}ms` }}>
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              type="number"
              dataKey="x"
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
              label={x_label ? { value: x_label, position: "bottom", offset: 0, fill: "rgba(255,255,255,0.5)", fontSize: 11 } : undefined}
              tick={{ fill: "rgba(255,255,255,0.6)" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              stroke="rgba(255,255,255,0.4)"
              fontSize={11}
              label={y_label ? { value: y_label, angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.5)", fontSize: 11 } : undefined}
              tick={{ fill: "rgba(255,255,255,0.6)" }}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15, 15, 30, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
              formatter={(val: number) => val.toLocaleString()}
            />
            <Scatter
              data={data}
              fill={primaryColor}
              fillOpacity={0.7}
              animationDuration={800}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
