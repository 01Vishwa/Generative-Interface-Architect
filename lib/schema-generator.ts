/**
 * Schema Document Generator
 * 
 * Converts parsed CSV data into a plain-English schema document
 * that gets injected into the LLM system prompt. The LLM uses this
 * to understand the user's data structure, column types, value ranges,
 * and sample rows — enabling it to generate accurate descriptors.
 * 
 * @module schema-generator
 */

export interface ColumnMeta {
  name: string;
  type: "number" | "text" | "date";
  uniqueValues?: string[];
  min?: number;
  max?: number;
  dateRange?: { earliest: string; latest: string };
}

export interface SchemaDoc {
  fileName: string;
  columns: ColumnMeta[];
  sampleRows: Record<string, string>[];
  rowCount: number;
  schemaText: string;
}

// ─── Type Detection ──────────────────────────────────────────────────────────

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,                    // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}$/,                  // MM/DD/YYYY
  /^\d{2}-\d{2}-\d{4}$/,                    // DD-MM-YYYY
  /^\d{4}\/\d{2}\/\d{2}$/,                  // YYYY/MM/DD
  /^[A-Za-z]+ \d{1,2},? \d{4}$/,           // Month DD, YYYY
];

function isDateValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return DATE_PATTERNS.some((p) => p.test(trimmed)) || !isNaN(Date.parse(trimmed));
}

function isNumericValue(value: string): boolean {
  const trimmed = value.trim().replace(/[$€£¥,]/g, "");
  if (!trimmed) return false;
  return !isNaN(Number(trimmed)) && trimmed !== "";
}

function parseNumericValue(value: string): number {
  return Number(value.trim().replace(/[$€£¥,]/g, ""));
}

// ─── Column Analysis ─────────────────────────────────────────────────────────

function inferColumnType(values: string[]): "number" | "text" | "date" {
  const nonEmpty = values.filter((v) => v.trim() !== "");
  if (nonEmpty.length === 0) return "text";

  const sampleSize = Math.min(nonEmpty.length, 20);
  const sample = nonEmpty.slice(0, sampleSize);

  const numericCount = sample.filter(isNumericValue).length;
  if (numericCount / sampleSize >= 0.8) return "number";

  const dateCount = sample.filter(isDateValue).length;
  if (dateCount / sampleSize >= 0.8) return "date";

  return "text";
}

function analyzeColumn(name: string, values: string[]): ColumnMeta {
  const type = inferColumnType(values);
  const meta: ColumnMeta = { name, type };

  const nonEmpty = values.filter((v) => v.trim() !== "");

  switch (type) {
    case "number": {
      const nums = nonEmpty.map(parseNumericValue).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        meta.min = Math.min(...nums);
        meta.max = Math.max(...nums);
      }
      break;
    }
    case "text": {
      const unique = [...new Set(nonEmpty)];
      if (unique.length <= 15) {
        meta.uniqueValues = unique.slice(0, 15);
      }
      break;
    }
    case "date": {
      const sorted = nonEmpty
        .map((v) => v.trim())
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      if (sorted.length > 0) {
        meta.dateRange = {
          earliest: sorted[0],
          latest: sorted[sorted.length - 1],
        };
      }
      break;
    }
  }

  return meta;
}

// ─── Schema Document Generation ──────────────────────────────────────────────

function formatColumnDescription(col: ColumnMeta): string {
  let desc = `${col.name} (${col.type}`;

  switch (col.type) {
    case "number":
      if (col.min !== undefined && col.max !== undefined) {
        desc += `, range: ${col.min.toLocaleString()}–${col.max.toLocaleString()}`;
      }
      break;
    case "text":
      if (col.uniqueValues) {
        desc += `, values: ${col.uniqueValues.join(", ")}`;
      }
      break;
    case "date":
      if (col.dateRange) {
        desc += `, range: ${col.dateRange.earliest} to ${col.dateRange.latest}`;
      }
      break;
  }

  desc += ")";
  return desc;
}

/**
 * Generates a plain-English schema document from parsed CSV data.
 * This document is injected into the LLM system prompt to give it
 * full awareness of the user's data structure.
 * 
 * @param fileName - Name of the uploaded CSV file
 * @param data - Parsed CSV rows as key-value objects
 * @returns SchemaDoc with structured metadata and plain-text summary
 */
export function generateSchemaDoc(
  fileName: string,
  data: Record<string, string>[]
): SchemaDoc {
  if (!data || data.length === 0) {
    return {
      fileName,
      columns: [],
      sampleRows: [],
      rowCount: 0,
      schemaText: `Table: ${fileName}\nNo data available.`,
    };
  }

  const columnNames = Object.keys(data[0]);
  const columns = columnNames.map((name) => {
    const values = data.map((row) => row[name] ?? "");
    return analyzeColumn(name, values);
  });

  const sampleRows = data.slice(0, 5);

  const columnDescriptions = columns
    .map(formatColumnDescription)
    .join(", ");

  const sampleRowsJson = JSON.stringify(sampleRows, null, 2);

  // Cap total schema text at 2000 chars to avoid context overflow
  let schemaText = `Table: ${fileName}\nColumns: ${columnDescriptions}\nRow count: ${data.length}\nSample rows (first 5):\n${sampleRowsJson}`;

  if (schemaText.length > 2000) {
    const truncatedSample = JSON.stringify(sampleRows.slice(0, 3), null, 2);
    schemaText = `Table: ${fileName}\nColumns: ${columnDescriptions}\nRow count: ${data.length}\nSample rows (first 3):\n${truncatedSample}`;
  }

  if (schemaText.length > 2000) {
    schemaText = schemaText.slice(0, 1997) + "...";
  }

  return {
    fileName,
    columns,
    sampleRows,
    rowCount: data.length,
    schemaText,
  };
}
