"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus trap: auto-focus cancel button
  useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [open]);

  // Esc = cancel
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
      // Simple focus trap — Tab stays within dialog
      if (e.key === "Tab") {
        const dialog = document.getElementById("confirm-dialog-inner");
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>("button, [tabindex]");
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--overlay-bg)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onCancel}
      >
        {/* Dialog */}
        <div
          id="confirm-dialog-inner"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          className="animate-fade-in"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 360,
            background: "var(--surface-0)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                background: "var(--bg-danger)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle style={{ width: 16, height: 16, color: "var(--text-danger)" }} />
            </div>
            <h3
              id="confirm-dialog-title"
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {title}
            </h3>
          </div>

          <p
            id="confirm-dialog-desc"
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              margin: "0 0 20px",
            }}
          >
            {message}
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              ref={cancelRef}
              onClick={onCancel}
              style={{
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 600,
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 600,
                background: "var(--bg-danger-strong)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
