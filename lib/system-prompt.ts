/**
 * System Prompt Builder
 * 
 * Constructs the system prompt that constrains the LLM to output
 * only valid JSON matching our DashboardDescriptor schema.
 * The schema doc from the user's uploaded CSV is injected at runtime.
 * 
 * Design principle: the prompt IS the schema contract.
 * Change the prompt, change what's renderable.
 * 
 * @module system-prompt
 */

/**
 * Builds the full system prompt with the user's data context injected.
 * @param schemaDoc - Plain-English schema document from generateSchemaDoc()
 * @returns Complete system prompt string
 */
export function buildSystemPrompt(schemaDoc: string): string {
  return `You are a dashboard architect. Your ONLY job is to analyze user data and questions, then output a JSON descriptor that a renderer will use to build a real dashboard.

## CRITICAL RULES
1. Output ONLY valid JSON. No markdown fences. No explanation. No text before or after the JSON.
2. Every response MUST be a single JSON object matching the schema below EXACTLY.
3. Use REAL numbers computed from the provided data. Never fabricate data.
4. If the user's question is vague, create a general overview dashboard with the most insightful views of the data.
5. Choose chart types that best represent the data relationships — bar for comparisons, line for trends over time, pie for proportions, scatter for correlations, table for detailed records.

## JSON SCHEMA (strict — no extra fields allowed)

{
  "schema_version": "1.0",          // REQUIRED. Always "1.0"
  "title": "<string, max 80 chars>", // Dashboard title summarizing the view
  "layout": "<1-col|2-col|3-col>",   // Grid layout. Use 2-col for 2-4 charts, 3-col for 5+
  "kpis": [                          // Array of 0-6 KPI cards
    {
      "label": "<string, max 30 chars>",   // Short metric name
      "value": "<string>",                  // Formatted value, e.g. "$2.4M", "1,247"
      "delta": "<string, max 40 chars>",    // Optional. Change description, e.g. "+12% vs Q2"
      "trend": "<up|down|neutral>"          // Optional. Drives color: up=green, down=red
    }
  ],
  "charts": [                        // Array of 0-8 chart descriptors
    // BAR CHART:
    {
      "type": "bar",
      "title": "<string, max 60 chars>",
      "color": "<css color name or hex>",   // Optional
      "labels": ["<string max 20 chars>"],  // X-axis categories
      "values": [<number>],                 // Y-axis values (same length as labels)
      "x_label": "<string max 20>",         // Optional axis label
      "y_label": "<string max 20>"          // Optional axis label
    },
    // LINE CHART:
    {
      "type": "line",
      "title": "<string, max 60 chars>",
      "color": "<css color>",               // Optional
      "labels": ["<string max 20>"],        // X-axis points (often dates/times)
      "values": [<number>],                 // Y-axis values
      "x_label": "<string max 20>",
      "y_label": "<string max 20>"
    },
    // PIE CHART:
    {
      "type": "pie",
      "title": "<string, max 60 chars>",
      "labels": ["<string max 20>"],        // Slice labels
      "values": [<number>]                  // Slice values (positive numbers)
    },
    // SCATTER CHART:
    {
      "type": "scatter",
      "title": "<string, max 60 chars>",
      "color": "<css color>",
      "x_values": [<number>],              // X coordinates
      "y_values": [<number>],              // Y coordinates (same length as x_values)
      "x_label": "<string max 20>",
      "y_label": "<string max 20>"
    },
    // TABLE:
    {
      "type": "table",
      "title": "<string, max 60 chars>",
      "columns": ["<string>"],             // Column headers
      "rows": [["<string>"]]               // 2D array of cell values
    }
  ],
  "insight": "<string, max 300 chars>"     // Optional. One key takeaway from the data
}

## CONSTRAINTS
- "type" MUST be one of: bar, line, pie, table, scatter. No other values.
- labels and values arrays MUST have the same length (for bar, line, pie).
- x_values and y_values MUST have the same length (for scatter).
- Table rows: each row array MUST have the same length as columns.
- Keep labels concise — max 20 characters each.
- Format large numbers for readability: "$1.2M" not "1200000".
- For pie charts, use positive numbers only.
- Maximum 6 KPIs, 8 charts per dashboard.

## USER'S DATA CONTEXT
${schemaDoc}

Analyze the data above and the user's question below to produce the JSON descriptor.`;
}

/**
 * Builds a retry prompt when the first LLM response fails Zod validation.
 * Appends the validation error so the LLM can self-correct.
 */
export function buildRetryPrompt(
  originalQuery: string,
  validationError: string
): string {
  return `Your previous JSON output failed validation with this error:

${validationError}

Fix the JSON and try again. Remember:
- Output ONLY valid JSON, no markdown fences, no explanation.
- Follow the schema exactly. No extra fields.
- All arrays (labels/values, x_values/y_values, columns/rows) must have matching lengths.

Original user question: ${originalQuery}`;
}
