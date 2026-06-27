// ─── Default Example Specs ───────────────────────────────────────────────────

export const DEFAULT_JSON_RENDER_SPEC = `{
  "root": "dashboard",
  "elements": {
    "dashboard": {
      "type": "Card",
      "props": { "title": "Revenue Overview", "subtitle": "Q2 2026" },
      "children": ["metrics-row", "divider-1", "summary-text", "actions-row"]
    },
    "metrics-row": {
      "type": "Stack",
      "props": { "direction": "row", "gap": "md" },
      "children": ["metric-revenue", "metric-users", "metric-avg"]
    },
    "metric-revenue": {
      "type": "Metric",
      "props": { "label": "Total Revenue", "value": "$1.2M", "trend": "up", "format": "currency" }
    },
    "metric-users": {
      "type": "Metric",
      "props": { "label": "Active Users", "value": "8,420", "trend": "up" }
    },
    "metric-avg": {
      "type": "Metric",
      "props": { "label": "Avg Order", "value": "$142", "trend": "down", "format": "currency" }
    },
    "divider-1": { "type": "Divider", "props": {} },
    "summary-text": {
      "type": "Text",
      "props": {
        "content": "Q2 performance exceeded target by 12%. Growth driven by enterprise segment expansion.",
        "size": "sm"
      }
    },
    "actions-row": {
      "type": "Stack",
      "props": { "direction": "row", "gap": "sm" },
      "children": ["badge-status", "btn-report"]
    },
    "badge-status": {
      "type": "Badge",
      "props": { "label": "On track", "color": "success" }
    },
    "btn-report": {
      "type": "Button",
      "props": { "label": "View full report", "variant": "primary" }
    }
  }
}`;

export const DEFAULT_A2UI_SPEC = `[
  { "createSurface": { "surfaceId": "main", "catalogId": "basic" } },
  { "updateComponents": { "surfaceId": "main", "components": [
    { "id": "root", "component": { "Card": {
      "title": { "literalString": "Revenue Overview" },
      "subtitle": { "literalString": "Q2 2026" },
      "children": { "literalString": "metrics-row divider-1 summary-text actions-row" }
    }}},
    { "id": "metrics-row", "component": { "Stack": {
      "direction": { "literalString": "row" },
      "gap": { "literalString": "md" },
      "children": { "literalString": "metric-revenue metric-users metric-avg" }
    }}},
    { "id": "metric-revenue", "component": { "Metric": {
      "label": { "literalString": "Total Revenue" },
      "value": { "literalString": "$1.2M" },
      "trend": { "literalString": "up" }
    }}},
    { "id": "metric-users", "component": { "Metric": {
      "label": { "literalString": "Active Users" },
      "value": { "literalString": "8,420" },
      "trend": { "literalString": "up" }
    }}},
    { "id": "metric-avg", "component": { "Metric": {
      "label": { "literalString": "Avg Order" },
      "value": { "literalString": "$142" },
      "trend": { "literalString": "down" }
    }}},
    { "id": "divider-1", "component": { "Divider": {} }},
    { "id": "summary-text", "component": { "Text": {
      "content": { "literalString": "Q2 performance exceeded target by 12%." },
      "size": { "literalString": "sm" }
    }}},
    { "id": "actions-row", "component": { "Stack": {
      "direction": { "literalString": "row" },
      "gap": { "literalString": "sm" },
      "children": { "literalString": "badge-status btn-report" }
    }}},
    { "id": "badge-status", "component": { "Badge": {
      "label": { "literalString": "On track" },
      "color": { "literalString": "success" }
    }}},
    { "id": "btn-report", "component": { "Button": {
      "label": { "literalString": "View full report" },
      "variant": { "literalString": "primary" }
    }}}
  ]}},
  { "updateDataModel": { "surfaceId": "main", "contents": {
    "revenue_formatted": "$1.2M",
    "users_formatted": "8,420"
  }}}
]`;
