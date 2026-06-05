"use client";

/**
 * Pie Chart Card Component
 * 
 * Wraps Recharts PieChart with custom labels and animated entry.
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { PieChart as PieChartType } from "@/lib/dashboard-schema";
import { resolveChartColor } from "./chart-utils";

interface PieChartCardProps extends PieChartType {
  index?: number;
}

export default function PieChartCard({
  title,
  labels,
  values,
  index = 0,
}: PieChartCardProps) {
  const data = labels.map((label, i) => ({
    name: label,
    value: values[i] ?? 0,
  }));

  const palette = resolveChartColor(undefined, index);

  return (
    <div className="chart-card" style={{ animationDelay: `${index * 100}ms` }}>
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              animationBegin={index * 100}
              animationDuration={800}
              stroke="none"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={{ stroke: "rgba(255,255,255,0.3)" }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={palette[i % palette.length]} />
              ))}
            </Pie>
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
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
