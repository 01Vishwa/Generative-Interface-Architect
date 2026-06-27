// ─── Toast Store — Global Notification System ────────────────────────────────
// Manages toast notifications: success, warning, error, info, undo.
// Max 3 visible at a time. Supports auto-dismiss, actions, countdown bars.

import { create } from "zustand";

export type ToastType = "success" | "warning" | "error" | "info" | "undo";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Auto-dismiss duration in ms. null = persistent. */
  duration: number | null;
  /** Optional inline action buttons */
  actions?: ToastAction[];
  /** Optional action link (e.g. "Configure in Settings") */
  actionLink?: { label: string; onClick: () => void };
  /** Whether this toast is currently dismissing (for exit animation) */
  dismissing?: boolean;
  /** Created timestamp */
  createdAt: number;
  /** Whether to show a progress pulse (for info toasts) */
  showProgress?: boolean;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id" | "createdAt" | "dismissing">) => string;
  removeToast: (id: string) => void;
  dismissToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Omit<Toast, "id">>) => void;
  clearAll: () => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastCounter}-${Date.now().toString(36)}`;
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: Date.now(),
      dismissing: false,
    };

    set((state) => {
      // Enforce max 3 visible: remove oldest non-persistent ones first
      let toasts = [...state.toasts, newToast];
      while (toasts.filter((t) => !t.dismissing).length > 3) {
        const oldest = toasts.find((t) => !t.dismissing && t.duration !== null);
        if (oldest) {
          toasts = toasts.filter((t) => t.id !== oldest.id);
        } else {
          // All persistent — remove oldest anyway
          toasts = toasts.slice(1);
        }
      }
      return { toasts };
    });

    // Auto-dismiss if duration is set
    if (toast.duration) {
      setTimeout(() => {
        get().dismissToast(id);
      }, toast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  dismissToast: (id) => {
    // Set dismissing state for exit animation
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, dismissing: true } : t
      ),
    }));
    // Remove after animation completes
    setTimeout(() => {
      get().removeToast(id);
    }, 200);
  },

  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));

    // If updating to have a duration, set auto-dismiss
    if (updates.duration) {
      setTimeout(() => {
        get().dismissToast(id);
      }, updates.duration);
    }
  },

  clearAll: () => set({ toasts: [] }),
}));
