"use client";

/**
 * Schema Preview Component
 * 
 * Shows the detected schema (column names, types, ranges)
 * from the uploaded CSV file.
 */

import type { SchemaDoc } from "@/lib/schema-generator";
import { Columns3, Hash, Type, Calendar } from "lucide-react";

interface SchemaPreviewProps {
  schema: SchemaDoc;
}

const typeIcons: Record<string, React.ReactNode> = {
  number: <Hash size={12} />,
  text: <Type size={12} />,
  date: <Calendar size={12} />,
};

export default function SchemaPreview({ schema }: SchemaPreviewProps) {
  return (
    <div className="schema-preview">
      <div className="schema-header">
        <Columns3 size={14} />
        <span>{schema.columns.length} columns</span>
        <span className="schema-divider">•</span>
        <span>{schema.rowCount.toLocaleString()} rows</span>
      </div>
      <div className="schema-columns">
        {schema.columns.map((col, i) => (
          <div key={i} className="schema-column-badge">
            {typeIcons[col.type]}
            <span className="schema-col-name">{col.name}</span>
            <span className="schema-col-type">{col.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
