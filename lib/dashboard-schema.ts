/**
 * Dashboard Descriptor Schema
 * 
 * Single source of truth for the JSON structure the LLM must produce.
 * Used for:
 *   1. Runtime validation of LLM output (Zod)
 *   2. TypeScript types for the renderer (inferred)
 *   3. System prompt generation (schema description)
 * 
 * @module dashboard-schema
 */

import { z } from "zod";

// ─── KPI Schema ──────────────────────────────────────────────────────────────

export const KPISchema = z.object({
  label: z
    .string()
    .min(1, "KPI label is required")
    .max(30, "KPI label must be ≤ 30 characters"),
  value: z
    .string()
    .min(1, "KPI value is required"),
  delta: z
    .string()
    .max(40, "KPI delta must be ≤ 40 characters")
    .optional(),
  trend: z
    .enum(["up", "down", "neutral"])
    .optional(),
});

// ─── Chart Schemas (Discriminated Union) ─────────────────────────────────────

const BaseChartFields = {
  title: z
    .string()
    .min(1, "Chart title is required")
    .max(60, "Chart title must be ≤ 60 characters"),
  color: z.string().optional(),
};

const AxisLabels = {
  x_label: z.string().max(20).optional(),
  y_label: z.string().max(20).optional(),
};

export const BarChartSchema = z.object({
  type: z.literal("bar"),
  ...BaseChartFields,
  labels: z.array(z.string().max(20)).min(1, "At least 1 label required"),
  values: z.array(z.number()).min(1, "At least 1 value required"),
  ...AxisLabels,
});

export const LineChartSchema = z.object({
  type: z.literal("line"),
  ...BaseChartFields,
  labels: z.array(z.string().max(20)).min(1, "At least 1 label required"),
  values: z.array(z.number()).min(1, "At least 1 value required"),
  ...AxisLabels,
});

export const PieChartSchema = z.object({
  type: z.literal("pie"),
  ...BaseChartFields,
  labels: z.array(z.string().max(20)).min(1, "At least 1 label required"),
  values: z.array(z.number()).min(1, "At least 1 value required"),
});

export const ScatterChartSchema = z.object({
  type: z.literal("scatter"),
  ...BaseChartFields,
  x_values: z.array(z.number()).min(1, "At least 1 x value required"),
  y_values: z.array(z.number()).min(1, "At least 1 y value required"),
  ...AxisLabels,
});

export const TableSchema = z.object({
  type: z.literal("table"),
  ...BaseChartFields,
  columns: z.array(z.string()).min(1, "At least 1 column required"),
  rows: z.array(z.array(z.string())).min(1, "At least 1 row required"),
});

export const ChartSchema = z.discriminatedUnion("type", [
  BarChartSchema,
  LineChartSchema,
  PieChartSchema,
  ScatterChartSchema,
  TableSchema,
]);

// ─── Root Dashboard Descriptor ───────────────────────────────────────────────

export const DashboardDescriptorSchema = z
  .object({
    schema_version: z.literal("1.0"),
    title: z
      .string()
      .min(1, "Dashboard title is required")
      .max(80, "Dashboard title must be ≤ 80 characters"),
    layout: z.enum(["1-col", "2-col", "3-col"]),
    kpis: z
      .array(KPISchema)
      .max(6, "Maximum 6 KPIs allowed"),
    charts: z
      .array(ChartSchema)
      .max(8, "Maximum 8 charts allowed"),
    insight: z
      .string()
      .max(300, "Insight must be ≤ 300 characters")
      .optional(),
  })
  .strict();

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type KPI = z.infer<typeof KPISchema>;
export type BarChart = z.infer<typeof BarChartSchema>;
export type LineChart = z.infer<typeof LineChartSchema>;
export type PieChart = z.infer<typeof PieChartSchema>;
export type ScatterChart = z.infer<typeof ScatterChartSchema>;
export type TableChart = z.infer<typeof TableSchema>;
export type Chart = z.infer<typeof ChartSchema>;
export type DashboardDescriptor = z.infer<typeof DashboardDescriptorSchema>;

// ─── Validation Helper ──────────────────────────────────────────────────────

export interface ValidationResult {
  success: boolean;
  data?: DashboardDescriptor;
  error?: string;
}

/**
 * Validates a raw object against the DashboardDescriptor schema.
 * Returns a structured result with either the validated data or a human-readable error.
 */
export function validateDescriptor(raw: unknown): ValidationResult {
  const result = DashboardDescriptorSchema.safeParse(raw);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessages = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  return { success: false, error: errorMessages };
}
