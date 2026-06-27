/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { DEFAULT_CATALOG } from "@/lib/catalog";
import { PropDefinition } from "@/lib/types";
import { X } from "lucide-react";

/**
 * Dynamic props form that generates form fields based on the catalog prop schema.
 * Handles: string, number, boolean, enum, string[], string[][].
 */
export default function PropsForm({
  componentType,
  props,
  elementId,
}: {
  componentType: string;
  props: Record<string, unknown>;
  elementId: string;
}) {
  const catalog = useSpecStore((s) => s.catalog);
  const updateProps = useSpecStore((s) => s.updateProps);
  const deleteComponent = useSpecStore((s) => s.deleteComponent);
  const compDef = catalog.components[componentType] || DEFAULT_CATALOG.components[componentType];

  if (!compDef) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No schema found for component type: {componentType}
      </div>
    );
  }

  const handleChange = (key: string, value: unknown) => {
    updateProps(elementId, { [key]: value as any });
  };

  return (
    <div className="space-y-4">
      {Object.entries(compDef.props).map(([propName, propDef]) => (
        <PropField
          key={propName}
          name={propName}
          definition={propDef}
          value={props[propName]}
          onChange={(val) => handleChange(propName, val)}
        />
      ))}

      {/* Delete button */}
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={() => {
            if (confirm("Remove this component?")) {
              deleteComponent(elementId);
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Remove component
        </button>
      </div>
    </div>
  );
}

// ─── Individual Prop Fields ──────────────────────────────────────────────────

function PropField({
  name,
  definition,
  value,
  onChange,
}: {
  name: string;
  definition: PropDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const label = (
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {name}
      {definition.required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );

  switch (definition.type) {
    case "string":
      return (
        <div>
          {label}
          <input
            type="text"
            value={(value as string) ?? ""}
            placeholder={definition.description}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
          />
        </div>
      );

    case "number":
      return (
        <div>
          {label}
          <input
            type="number"
            value={(value as number) ?? ""}
            placeholder={definition.description}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
          />
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">{name}</span>
          <button
            onClick={() => onChange(!value)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              value ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                value ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      );

    case "enum":
      return (
        <div>
          {label}
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
          >
            <option value="">— none —</option>
            {definition.values?.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      );

    case "string[]":
      return <StringArrayField name={name} definition={definition} value={value as string[] | undefined} onChange={onChange} />;

    case "string[][]":
      return <StringArrayArrayField name={name} definition={definition} value={value as string[][] | undefined} onChange={onChange} />;

    default:
      return (
        <div>
          {label}
          <input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
          />
        </div>
      );
  }
}

// ─── Tag Input for string[] ──────────────────────────────────────────────────

function StringArrayField({
  name,
  definition,
  value,
  onChange,
}: {
  name: string;
  definition: PropDefinition;
  value?: string[];
  onChange: (val: string[]) => void;
}) {
  const items = value || [];
  const [input, setInput] = React.useState("");

  const addItem = () => {
    if (input.trim()) {
      onChange([...items, input.trim()]);
      setInput("");
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {name}
        {definition.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md"
          >
            {item}
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-blue-400 hover:text-blue-600"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          placeholder="Add item..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none bg-gray-50/50"
        />
        <button
          onClick={addItem}
          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Mini Table Editor for string[][] ────────────────────────────────────────

function StringArrayArrayField({
  name,
  definition,
  value,
  onChange,
}: {
  name: string;
  definition: PropDefinition;
  value?: string[][];
  onChange: (val: string[][]) => void;
}) {
  const rows = value || [];

  const updateCell = (ri: number, ci: number, text: string) => {
    const newRows = rows.map((r, i) =>
      i === ri ? r.map((c, j) => (j === ci ? text : c)) : r
    );
    onChange(newRows);
  };

  const addRow = () => {
    const colCount = rows[0]?.length || 2;
    onChange([...rows, Array(colCount).fill("")]);
  };

  const removeRow = (ri: number) => {
    onChange(rows.filter((_, i) => i !== ri));
  };

  const addColumn = () => {
    onChange(rows.map((r) => [...r, ""]));
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {name}
        {definition.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-center border-b border-gray-100 last:border-0">
            {row.map((cell, ci) => (
              <input
                key={ci}
                type="text"
                value={cell}
                onChange={(e) => updateCell(ri, ci, e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 border-r border-gray-100 last:border-0 outline-none focus:bg-blue-50/30"
              />
            ))}
            <button
              onClick={() => removeRow(ri)}
              className="px-2 text-gray-400 hover:text-red-500 text-xs"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1.5">
        <button
          onClick={addRow}
          className="flex-1 px-2 py-1 text-[11px] bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
        >
          + Row
        </button>
        <button
          onClick={addColumn}
          className="flex-1 px-2 py-1 text-[11px] bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
        >
          + Column
        </button>
      </div>
    </div>
  );
}
