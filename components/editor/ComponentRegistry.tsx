"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRegistryStore } from "@/lib/store/useRegistryStore";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { Search, Plus, Layers, Package, ChevronRight, ChevronDown } from "lucide-react";

// Group definitions
const SECTION_ORDER = ["Layout", "Form", "Display", "Custom"] as const;

function getSectionForTags(tags: string[]): string {
  if (tags.some((t) => ["layout", "container", "separator"].includes(t))) return "Layout";
  if (tags.some((t) => ["form", "interactive"].includes(t))) return "Form";
  if (tags.some((t) => ["data", "display", "typography", "feedback", "status"].includes(t))) return "Display";
  return "Custom";
}

const COLLAPSE_KEY = "genui-registry-collapse";

function loadCollapseState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function ComponentRegistry() {
  const { entries, searchQuery, getFilteredEntries, setSearchQuery } = useRegistryStore();
  const insertComponent = useSpecStore((s) => s.insertComponent);
  const addToast = useToastStore((s) => s.addToast);

  const [collapseState, setCollapseState] = useState<Record<string, boolean>>(loadCollapseState);
  const [debounceQuery, setDebounceQuery] = useState(searchQuery);

  // Debounced search (150ms)
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(debounceQuery), 150);
    return () => clearTimeout(timer);
  }, [debounceQuery, setSearchQuery]);

  // Persist collapse state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapseState));
    }
  }, [collapseState]);

  const toggleSection = useCallback((section: string) => {
    setCollapseState((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const filtered = getFilteredEntries();

  // Group by section
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const section of SECTION_ORDER) {
      groups[section] = [];
    }
    for (const entry of filtered) {
      const section = getSectionForTags(entry.tags);
      if (!groups[section]) groups[section] = [];
      groups[section].push(entry);
    }
    return groups;
  }, [filtered]);

  const handleInsert = (name: string) => {
    insertComponent(name);
    addToast({ type: "success", message: `${name} inserted`, duration: 3000 });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--sidebar-bg)",
      }}
    >
      {/* Header & Search */}
      <div
        style={{
          padding: "12px 12px 8px",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "var(--sidebar-bg)",
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <Package style={{ width: 14, height: 14 }} />
            Registry
          </div>
          <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--surface-2)", padding: "2px 6px", borderRadius: "var(--radius-sm)" }}>
            {filtered.length}
          </span>
        </div>

        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--text-muted)" }} />
          <input
            type="text"
            value={debounceQuery}
            onChange={(e) => setDebounceQuery(e.target.value)}
            placeholder="Search components…"
            style={{
              width: "100%",
              padding: "6px 10px 6px 28px",
              fontSize: 12,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Component List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
        {SECTION_ORDER.map((section) => {
          const items = grouped[section] || [];
          if (items.length === 0) return null;
          const isCollapsed = collapseState[section];

          return (
            <div key={section} style={{ marginBottom: 4 }}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(section)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  width: "100%",
                  padding: "6px 4px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {isCollapsed ? (
                  <ChevronRight style={{ width: 12, height: 12 }} />
                ) : (
                  <ChevronDown style={{ width: 12, height: 12 }} />
                )}
                {section}
                <span style={{ fontSize: 9, opacity: 0.6, marginLeft: "auto" }}>{items.length}</span>
              </button>

              {/* Section items */}
              {!isCollapsed && (
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {items.map((comp) => (
                    <div
                      key={comp.name}
                      onClick={() => handleInsert(comp.name)}
                      title={comp.definition.description || comp.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        transition: "background 0.1s",
                        background: "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "var(--radius-sm)",
                          background: "var(--bg-info)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Layers style={{ width: 12, height: 12, color: "var(--text-info)" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", flex: 1 }}>
                        {comp.name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: "var(--radius-full)",
                          background: "var(--surface-2)",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        {comp.definition.tags?.[0] || comp.source}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
            No components found for &quot;{debounceQuery}&quot;
          </div>
        )}
      </div>

      {/* Footer: New Component */}
      <div style={{ padding: 8, borderTop: "1px solid var(--border)" }}>
        <button
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 0",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-accent)",
            background: "transparent",
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-info)";
            e.currentTarget.style.borderColor = "var(--border-accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          New component
        </button>
      </div>
    </div>
  );
}
