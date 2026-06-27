"use client";

import React, { useState } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { findSourceIdPath } from "@/lib/ir/selection";
import PropsForm from "./PropsForm";
import {
  ChevronRight,
  Type,
  ChevronDown,
  Trash2,
} from "lucide-react";

export default function PropsInspector() {
  const irDocument = useSpecStore((s) => s.irDocument);
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const selectNode = useSpecStore((s) => s.selectNode);
  const getSelectedNode = useSpecStore((s) => s.getSelectedNode);
  const getSelectedElement = useSpecStore((s) => s.getSelectedElement);
  const deleteComponent = useSpecStore((s) => s.deleteComponent);
  const addToast = useToastStore((s) => s.addToast);

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const node = getSelectedNode();
  const legacyElement = getSelectedElement();

  // No selection → empty state
  if (!selectedNodeId || !irDocument || !node || !legacyElement) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          textAlign: "center",
          background: "var(--sidebar-bg)",
        }}
      >
        <Type
          style={{
            width: 32,
            height: 32,
            color: "var(--text-muted)",
            marginBottom: 12,
            opacity: 0.5,
          }}
        />
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
          Select a component to inspect its props.
        </span>
      </div>
    );
  }

  // Build breadcrumb path
  const path = findSourceIdPath(irDocument.root, selectedNodeId);

  const handleDelete = () => {
    const nodeName = node.type;
    const nodeId = selectedNodeId;

    // Store data for undo
    addToast({
      type: "undo",
      message: `${nodeName} deleted · Undo`,
      duration: 5000,
      actionLink: {
        label: "Undo",
        onClick: () => {
          // Undo via the store's undo mechanism
          const specStore = useSpecStore.getState();
          if (specStore.canUndo()) specStore.undo();
        },
      },
    });

    deleteComponent(nodeId);
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
      {/* Header */}
      <div
        style={{
          padding: "12px 12px 8px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Properties
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-info)",
              background: "var(--bg-info)",
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
            }}
          >
            {node.type}
          </span>
        </div>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          {path.map((sourceId, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <ChevronRight style={{ width: 10, height: 10, color: "var(--text-muted)", flexShrink: 0 }} />
              )}
              <button
                onClick={() => {
                  // Select this ancestor node — find its actual nodeId
                  // For now, clicking the last breadcrumb segment does nothing special
                  if (i < path.length - 1) {
                    selectNode(sourceId);
                  }
                }}
                style={{
                  fontSize: 10,
                  fontWeight: i === path.length - 1 ? 600 : 400,
                  color: i === path.length - 1 ? "var(--text-accent)" : "var(--text-muted)",
                  background: i === path.length - 1 ? "var(--bg-info)" : "transparent",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.1s, background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (i < path.length - 1) {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.background = "var(--surface-2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (i < path.length - 1) {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {sourceId}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Props Form */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        <PropsForm
          componentType={node.type}
          props={legacyElement.props}
          elementId={selectedNodeId}
        />
      </div>

      {/* Advanced collapsible */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            width: "100%",
            padding: "8px 12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {advancedOpen ? (
            <ChevronDown style={{ width: 12, height: 12 }} />
          ) : (
            <ChevronRight style={{ width: 12, height: 12 }} />
          )}
          Advanced
        </button>
        {advancedOpen && (
          <div style={{ padding: "0 12px 12px", maxHeight: 200, overflowY: "auto" }}>
            <pre
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--text-secondary)",
                background: "var(--surface-2)",
                padding: 8,
                borderRadius: "var(--radius-sm)",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                margin: 0,
              }}
            >
              {JSON.stringify(node.props, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Delete node button */}
      <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
        <button
          onClick={handleDelete}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "8px 0",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-danger)",
            background: "var(--bg-danger)",
            border: "1px solid var(--border-danger)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-danger-strong)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--bg-danger)";
            e.currentTarget.style.color = "var(--text-danger)";
          }}
        >
          <Trash2 style={{ width: 14, height: 14 }} />
          Delete node
        </button>
      </div>
    </div>
  );
}
