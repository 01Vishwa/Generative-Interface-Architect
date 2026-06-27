"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import type { IRNode } from "@/lib/ir/types";

/**
 * Sandbox page — rendered inside an iframe by LivePreview.
 * Receives IR documents via postMessage, renders a visual component tree,
 * and sends selection events back to the parent window.
 */

interface SandboxState {
  irRoot: IRNode | null;
  consoleMessages: { level: string; message: string; timestamp: number }[];
}

export default function SandboxPage() {
  const [state, setState] = useState<SandboxState>({
    irRoot: null,
    consoleMessages: [],
  });

  // Listen for IR updates from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case "UPDATE_SPEC":
          if (payload?.root) {
            setState((prev) => ({ ...prev, irRoot: payload.root }));
          }
          break;

        case "HIGHLIGHT_NODE":
          // Add visual highlight to the specified node
          highlightNode(payload?.nodeId);
          break;

        case "SET_THEME":
          // Apply theme to the sandbox
          document.documentElement.classList.toggle("dark", payload?.theme === "dark");
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Intercept console.log and forward to parent
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const sendConsole = (level: string, args: unknown[]) => {
      const message = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
      window.parent.postMessage(
        { type: "CONSOLE_MESSAGE", payload: { level, message, timestamp: Date.now() } },
        "*"
      );
    };

    console.log = (...args: unknown[]) => {
      originalLog.apply(console, args);
      sendConsole("log", args);
    };
    console.warn = (...args: unknown[]) => {
      originalWarn.apply(console, args);
      sendConsole("warn", args);
    };
    console.error = (...args: unknown[]) => {
      originalError.apply(console, args);
      sendConsole("error", args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  // Send node click events to parent for bidirectional selection
  const handleNodeClick = useCallback((nodeId: string) => {
    window.parent.postMessage(
      { type: "NODE_SELECTED", payload: { nodeId } },
      "*"
    );
  }, []);

  // Notify parent that sandbox is ready
  useEffect(() => {
    window.parent.postMessage({ type: "SANDBOX_READY" }, "*");
  }, []);

  if (!state.irRoot) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Waiting for spec...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <SandboxErrorBoundary>
        {state.irRoot.children.map((child) => (
          <SandboxNodeRenderer
            key={child.id}
            node={child}
            onNodeClick={handleNodeClick}
          />
        ))}
      </SandboxErrorBoundary>
    </div>
  );
}

// ─── Node Renderer for Sandbox ───────────────────────────────────────────────

function SandboxNodeRenderer({
  node,
  onNodeClick,
}: {
  node: IRNode;
  onNodeClick: (id: string) => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick(node.id);
  };

  // Extract props as plain values
  const props: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(node.props)) {
    if (typeof val === "object" && val !== null) {
      const v = val as Record<string, unknown>;
      if ("__binding" in v) {
        props[key] = (v.__binding as Record<string, unknown>).resolvedValue ?? `{{bound}}`;
      } else if ("__ref" in v) props[key] = v.__ref;
      else if ("__expr" in v) props[key] = v.__expr;
      else props[key] = val;
    } else {
      props[key] = val;
    }
  }

  // Simple rendering based on component type
  return (
    <div
      data-node-id={node.id}
      onClick={handleClick}
      className="relative group cursor-pointer"
      style={{ marginBottom: "8px" }}
    >
      {/* Selection indicator */}
      <div className="absolute inset-0 rounded-lg ring-1 ring-transparent group-hover:ring-blue-500/40 pointer-events-none transition-all z-10" />

      {/* Component type badge on hover */}
      <div className="absolute -top-2.5 left-2 z-20 bg-blue-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {node.type}
      </div>

      {/* Render based on type */}
      <SandboxComponent type={node.type} props={props}>
        {node.children.map((child) => (
          <SandboxNodeRenderer key={child.id} node={child} onNodeClick={onNodeClick} />
        ))}
      </SandboxComponent>
    </div>
  );
}

// ─── Simplified Component Renderer ───────────────────────────────────────────

function SandboxComponent({
  type,
  props,
  children,
}: {
  type: string;
  props: Record<string, unknown>;
  children?: React.ReactNode;
}) {
  switch (type) {
    case "Card":
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          {props.title && <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{String(props.title)}</h3>}
          {props.subtitle && <p className="text-xs text-gray-500 mb-3">{String(props.subtitle)}</p>}
          {children}
        </div>
      );

    case "Text":
      return (
        <p className={`text-sm text-gray-700 dark:text-gray-300 ${props.variant === "heading" ? "text-lg font-bold" : ""}`}>
          {String(props.content || props.text || "")}
        </p>
      );

    case "Button":
      return (
        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          props.variant === "secondary"
            ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            : "bg-blue-600 text-white hover:bg-blue-500"
        }`}>
          {String(props.label || props.text || "Button")}
        </button>
      );

    case "Metric":
      return (
        <div className="p-3">
          <div className="text-xs text-gray-500 mb-1">{String(props.label || "")}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{String(props.value || "0")}</div>
          {props.trend && <div className="text-xs text-emerald-500 mt-1">{String(props.trend)}</div>}
        </div>
      );

    case "Stack":
      return (
        <div className={`flex ${props.direction === "row" ? "flex-row" : "flex-col"} gap-${props.gap || "3"}`}>
          {children}
        </div>
      );

    case "Badge":
      return (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
          props.variant === "success" ? "bg-emerald-100 text-emerald-700" :
          props.variant === "warning" ? "bg-amber-100 text-amber-700" :
          props.variant === "danger" ? "bg-red-100 text-red-700" :
          "bg-blue-100 text-blue-700"
        }`}>
          {String(props.text || props.label || "")}
        </span>
      );

    case "Divider":
      return <hr className="border-gray-200 dark:border-gray-800 my-3" />;

    case "Alert":
      return (
        <div className={`p-3 rounded-lg text-sm ${
          props.variant === "warning" ? "bg-amber-50 text-amber-800 border border-amber-200" :
          props.variant === "error" ? "bg-red-50 text-red-800 border border-red-200" :
          props.variant === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
          "bg-blue-50 text-blue-800 border border-blue-200"
        }`}>
          {String(props.message || props.text || "")}
        </div>
      );

    case "Input":
      return (
        <div>
          {props.label && <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">{String(props.label)}</label>}
          <input
            type={String(props.type || "text")}
            placeholder={String(props.placeholder || "")}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            readOnly
          />
        </div>
      );

    case "Progress":
      return (
        <div>
          {props.label && <div className="text-xs text-gray-500 mb-1">{String(props.label)}</div>}
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Number(props.value || 0)}%` }}
            />
          </div>
        </div>
      );

    case "Table":
      return (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            {props.headers && (
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {(Array.isArray(props.headers) ? props.headers : []).map((h: unknown, i: number) => (
                    <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{String(h)}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>{children}</tbody>
          </table>
        </div>
      );

    default:
      return (
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          <div className="text-[10px] text-gray-500 mb-1">{type}</div>
          {children}
        </div>
      );
  }
}

// ─── Error Boundary ──────────────────────────────────────────────────────────

class SandboxErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    window.parent.postMessage(
      { type: "CONSOLE_MESSAGE", payload: { level: "error", message: error.message, timestamp: Date.now() } },
      "*"
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <strong>Render Error:</strong> {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Highlight helper ────────────────────────────────────────────────────────

function highlightNode(nodeId?: string) {
  // Remove previous highlights
  document.querySelectorAll("[data-highlighted]").forEach((el) => {
    el.removeAttribute("data-highlighted");
    (el as HTMLElement).style.outline = "";
  });

  if (!nodeId) return;

  const el = document.querySelector(`[data-node-id="${nodeId}"]`);
  if (el) {
    el.setAttribute("data-highlighted", "true");
    (el as HTMLElement).style.outline = "2px solid #3b82f6";
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
