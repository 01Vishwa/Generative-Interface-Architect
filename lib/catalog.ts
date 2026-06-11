import { CatalogDefinition } from "./types";

// ─── Default 12-Component Catalog ────────────────────────────────────────────

export const DEFAULT_CATALOG: CatalogDefinition = {
  components: {
    Card: {
      description: "Container card with optional title and subtitle",
      props: {
        title: { type: "string", required: true, description: "Card heading text" },
        subtitle: { type: "string", required: false, description: "Secondary heading" },
        description: { type: "string", required: false, description: "Body text content" },
      },
      hasChildren: true,
    },
    Metric: {
      description: "Displays a single metric value with optional trend indicator",
      props: {
        label: { type: "string", required: true, description: "Metric label" },
        value: { type: "string", required: true, description: "Display value (e.g. $48,200)" },
        trend: { type: "enum", values: ["up", "down", "neutral"], required: false, description: "Trend direction arrow" },
        format: { type: "enum", values: ["currency", "percent", "number", "text"], required: false, description: "Value display format" },
      },
      hasChildren: false,
    },
    Text: {
      description: "Text block with configurable size and weight",
      props: {
        content: { type: "string", required: true, description: "Text content" },
        size: { type: "enum", values: ["sm", "md", "lg", "xl"], required: false, description: "Font size" },
        weight: { type: "enum", values: ["normal", "medium", "bold"], required: false, description: "Font weight" },
      },
      hasChildren: false,
    },
    Button: {
      description: "Clickable button with styling variants",
      props: {
        label: { type: "string", required: true, description: "Button text" },
        variant: { type: "enum", values: ["primary", "secondary", "danger", "ghost"], required: false, description: "Visual style" },
        action: { type: "string", required: false, description: "Action identifier" },
      },
      hasChildren: false,
    },
    Badge: {
      description: "Status badge pill indicator",
      props: {
        label: { type: "string", required: true, description: "Badge text" },
        color: { type: "enum", values: ["success", "warning", "danger", "info", "neutral"], required: false, description: "Badge color theme" },
      },
      hasChildren: false,
    },
    Divider: {
      description: "Horizontal separator line",
      props: {},
      hasChildren: false,
    },
    Stack: {
      description: "Flex layout container for arranging children",
      props: {
        direction: { type: "enum", values: ["row", "column"], required: false, description: "Layout direction" },
        gap: { type: "enum", values: ["sm", "md", "lg"], required: false, description: "Spacing between children" },
        wrap: { type: "boolean", required: false, description: "Allow wrapping" },
      },
      hasChildren: true,
    },
    Table: {
      description: "Data table with headers and row data",
      props: {
        columns: { type: "string[]", required: true, description: "Column header names" },
        rows: { type: "string[][]", required: true, description: "Row data as arrays of strings" },
      },
      hasChildren: false,
    },
    Input: {
      description: "Text input field with optional label",
      props: {
        label: { type: "string", required: false, description: "Input label" },
        placeholder: { type: "string", required: false, description: "Placeholder text" },
        type: { type: "enum", values: ["text", "number", "email", "password"], required: false, description: "Input type" },
      },
      hasChildren: false,
    },
    Select: {
      description: "Dropdown select with options list",
      props: {
        label: { type: "string", required: false, description: "Select label" },
        options: { type: "string[]", required: true, description: "Selectable option values" },
        placeholder: { type: "string", required: false, description: "Placeholder text" },
      },
      hasChildren: false,
    },
    Progress: {
      description: "Progress bar indicator (0–100)",
      props: {
        value: { type: "number", required: true, description: "Progress value (0–100)" },
        label: { type: "string", required: false, description: "Progress label" },
        color: { type: "enum", values: ["blue", "green", "yellow", "red"], required: false, description: "Bar color" },
      },
      hasChildren: false,
    },
    Alert: {
      description: "Alert message box with severity levels",
      props: {
        message: { type: "string", required: true, description: "Alert message text" },
        severity: { type: "enum", values: ["info", "warning", "error", "success"], required: false, description: "Severity level" },
      },
      hasChildren: false,
    },
  },
};

// ─── Default Prop Values for Insertion ───────────────────────────────────────

export function getDefaultProps(componentType: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    Card: { title: "New Card" },
    Metric: { label: "Metric", value: "0" },
    Text: { content: "Enter text here" },
    Button: { label: "Click Me", variant: "primary" },
    Badge: { label: "Status", color: "info" },
    Divider: {},
    Stack: { direction: "column", gap: "md" },
    Table: { columns: ["Column A", "Column B"], rows: [["Row 1A", "Row 1B"], ["Row 2A", "Row 2B"]] },
    Input: { label: "Label", placeholder: "Type here..." },
    Select: { label: "Choose", options: ["Option A", "Option B", "Option C"] },
    Progress: { value: 50, label: "Progress" },
    Alert: { message: "This is an alert message.", severity: "info" },
  };
  return defaults[componentType] || {};
}
