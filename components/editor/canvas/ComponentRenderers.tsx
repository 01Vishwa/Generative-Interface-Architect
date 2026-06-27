/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

export function CardRenderer({
  title,
  subtitle,
  description,
  children,
}: {
  title?: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden transition-shadow hover:shadow-md">
      <div className="px-6 py-5 border-b border-gray-100">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {description && (
        <p className="px-6 pt-4 text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      )}
      {children && (
        <div className="px-6 py-4 space-y-3">{children}</div>
      )}
    </div>
  );
}

export function MetricRenderer({
  label,
  value,
  trend,
}: {
  label?: string;
  value?: string;
  trend?: "up" | "down" | "neutral";
  format?: string;
}) {
  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg border border-gray-100">
      {label && (
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </p>
      )}
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-2xl font-bold text-gray-900 tabular-nums">
          {value}
        </span>
        {trend === "up" && (
          <span className="flex items-center gap-0.5 text-emerald-600 text-sm font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
            ↑
          </span>
        )}
        {trend === "down" && (
          <span className="flex items-center gap-0.5 text-red-500 text-sm font-medium bg-red-50 px-1.5 py-0.5 rounded">
            ↓
          </span>
        )}
        {trend === "neutral" && (
          <span className="flex items-center gap-0.5 text-gray-400 text-sm font-medium bg-gray-100 px-1.5 py-0.5 rounded">
            →
          </span>
        )}
      </div>
    </div>
  );
}

export function TextRenderer({
  content,
  size,
  weight,
}: {
  content?: string;
  size?: "sm" | "md" | "lg" | "xl";
  weight?: "normal" | "medium" | "bold";
}) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };
  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    bold: "font-bold",
  };

  return (
    <p
      className={`text-gray-700 leading-relaxed ${sizeClasses[size || "md"]} ${weightClasses[weight || "normal"]}`}
    >
      {content}
    </p>
  );
}

export function ButtonRenderer({
  label,
  variant,
}: {
  label?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  action?: string;
}) {
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200",
    danger:
      "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200",
    ghost:
      "bg-transparent text-blue-600 hover:bg-blue-50",
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-default ${variants[variant || "primary"]}`}
    >
      {label}
    </button>
  );
}

export function BadgeRenderer({
  label,
  color,
}: {
  label?: string;
  color?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const colors = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200",
    danger: "bg-red-50 text-red-700 ring-red-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-gray-100 text-gray-600 ring-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${colors[color || "neutral"]}`}
    >
      {label}
    </span>
  );
}

export function DividerRenderer() {
  return <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-1" />;
}

export function StackRenderer({
  direction,
  gap,
  wrap,
  children,
}: {
  direction?: "row" | "column";
  gap?: "sm" | "md" | "lg";
  wrap?: boolean;
  children?: React.ReactNode;
}) {
  const gaps = { sm: "gap-2", md: "gap-4", lg: "gap-6" };
  const dir = direction === "row" ? "flex-row" : "flex-col";

  return (
    <div
      className={`flex ${dir} ${gaps[gap || "md"]} ${wrap ? "flex-wrap" : ""}`}
    >
      {children}
    </div>
  );
}

export function TableRenderer({
  columns,
  rows,
}: {
  columns?: string[];
  rows?: string[][];
}) {
  if (!columns?.length) return <div className="text-gray-400 text-sm">No columns defined</div>;

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {(rows || []).map((row, ri) => (
            <tr key={ri} className="hover:bg-gray-50/50 transition-colors">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InputRenderer({
  label,
  placeholder,
  type,
}: {
  label?: string;
  placeholder?: string;
  type?: "text" | "number" | "email" | "password";
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type={type || "text"}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        readOnly
      />
    </div>
  );
}

export function SelectRenderer({
  label,
  options,
  placeholder,
}: {
  label?: string;
  options?: string[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none">
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {(options || []).map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProgressRenderer({
  value,
  label,
  color,
}: {
  value?: number;
  label?: string;
  color?: "blue" | "green" | "yellow" | "red";
}) {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    yellow: "bg-amber-500",
    red: "bg-red-500",
  };
  const pct = Math.max(0, Math.min(100, value || 0));

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-xs text-gray-500 tabular-nums">{pct}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors[color || "blue"]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AlertRenderer({
  message,
  severity,
}: {
  message?: string;
  severity?: "info" | "warning" | "error" | "success";
}) {
  const styles = {
    info: { container: "bg-blue-50 border-blue-200 text-blue-800", icon: "ℹ" },
    warning: { container: "bg-amber-50 border-amber-200 text-amber-800", icon: "⚠" },
    error: { container: "bg-red-50 border-red-200 text-red-800", icon: "✕" },
    success: { container: "bg-emerald-50 border-emerald-200 text-emerald-800", icon: "✓" },
  };
  const s = styles[severity || "info"];

  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border text-sm ${s.container}`}
    >
      <span className="text-base leading-none mt-0.5">{s.icon}</span>
      <span>{message}</span>
    </div>
  );
}

// ─── Renderer Map ────────────────────────────────────────────────────────────

export const RENDERER_MAP: Record<string, React.FC<any>> = {
  Card: CardRenderer,
  Metric: MetricRenderer,
  Text: TextRenderer,
  Button: ButtonRenderer,
  Badge: BadgeRenderer,
  Divider: DividerRenderer,
  Stack: StackRenderer,
  Table: TableRenderer,
  Input: InputRenderer,
  Select: SelectRenderer,
  Progress: ProgressRenderer,
  Alert: AlertRenderer,
};
