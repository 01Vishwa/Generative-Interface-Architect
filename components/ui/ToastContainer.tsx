"use client";

import React from "react";
import { useToastStore } from "@/lib/store/useToastStore";
import type { Toast as ToastType } from "@/lib/store/useToastStore";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Undo2,
  X,
} from "lucide-react";

/* ─── Single Toast ────────────────────────────────────────────────────────── */

function Toast({ toast }: { toast: ToastType }) {
  const { dismissToast } = useToastStore();

  const borderColorMap: Record<string, string> = {
    success: "var(--border-success)",
    warning: "var(--border-warning)",
    error: "var(--border-danger)",
    info: "var(--border-info)",
    undo: "var(--text-muted)",
  };

  const iconMap: Record<string, React.ReactNode> = {
    success: <CheckCircle2 style={{ width: 16, height: 16, color: "var(--text-success)" }} />,
    warning: <AlertTriangle style={{ width: 16, height: 16, color: "var(--text-warning)" }} />,
    error: <XCircle style={{ width: 16, height: 16, color: "var(--text-danger)" }} />,
    info: <Info style={{ width: 16, height: 16, color: "var(--text-info)" }} />,
    undo: <Undo2 style={{ width: 16, height: 16, color: "var(--text-muted)" }} />,
  };

  const borderColor = borderColorMap[toast.type] || "var(--border)";
  const animClass = toast.dismissing ? "animate-toast-out" : "animate-toast-in";

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      className={animClass}
      style={{
        width: 320,
        background: "var(--surface-0)",
        border: `0.5px solid ${borderColor}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "var(--radius-lg)",
        padding: 14,
        position: "relative",
        boxShadow: "var(--shadow-toast)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Close button */}
      <button
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss notification"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 2,
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-sm)",
          transition: "color 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--text-primary)";
          e.currentTarget.style.background = "var(--surface-2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.background = "none";
        }}
      >
        <X style={{ width: 14, height: 14 }} />
      </button>

      {/* Content row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingRight: 20 }}>
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          {iconMap[toast.type]}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              lineHeight: 1.4,
            }}
          >
            {toast.message}
          </span>

          {/* Action link */}
          {toast.actionLink && (
            <button
              onClick={() => {
                toast.actionLink!.onClick();
                dismissToast(toast.id);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-accent)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              {toast.actionLink.label}
            </button>
          )}

          {/* Inline action buttons */}
          {toast.actions && toast.actions.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              {toast.actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    action.onClick();
                    dismissToast(toast.id);
                  }}
                  style={{
                    background: i === toast.actions!.length - 1 ? "var(--bg-accent)" : "transparent",
                    color: i === toast.actions!.length - 1 ? "#fff" : "var(--text-accent)",
                    border: i === toast.actions!.length - 1 ? "none" : "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress pulse for info toasts */}
      {toast.showProgress && (
        <div
          className="animate-progress-pulse"
          style={{
            height: 2,
            borderRadius: "var(--radius-full)",
            background: "var(--border-info)",
            marginTop: 2,
          }}
        />
      )}

      {/* Countdown bar for auto-dismiss */}
      {toast.type === "undo" && toast.duration && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 4,
            right: 0,
            height: 3,
            borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div
            className="toast-countdown"
            style={{
              height: "100%",
              background: "var(--text-muted)",
              animationDuration: `${toast.duration}ms`,
              borderRadius: "0 0 var(--radius-lg) 0",
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Toast Container ─────────────────────────────────────────────────────── */

export default function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      style={{
        position: "fixed",
        top: 60, /* below header */
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: "auto" }}>
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
}
