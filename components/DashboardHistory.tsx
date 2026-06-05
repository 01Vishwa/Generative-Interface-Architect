"use client";

/**
 * Dashboard History Component
 * 
 * Sidebar panel listing saved dashboards with click-to-reload
 * and delete functionality.
 */

import { useState, useEffect } from "react";
import {
  listDashboards,
  loadDashboard,
  deleteDashboard,
  type DashboardSummary,
  type StoredDashboard,
} from "@/lib/dashboard-store";
import { History, Trash2, Clock, ChevronRight } from "lucide-react";

interface DashboardHistoryProps {
  onLoad: (dashboard: StoredDashboard) => void;
}

export default function DashboardHistory({ onLoad }: DashboardHistoryProps) {
  const [dashboards, setDashboards] = useState<DashboardSummary[]>([]);

  useEffect(() => {
    setDashboards(listDashboards());
  }, []);

  const refresh = () => setDashboards(listDashboards());

  const handleLoad = (id: string) => {
    const dashboard = loadDashboard(id);
    if (dashboard) onLoad(dashboard);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDashboard(id);
    refresh();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  if (dashboards.length === 0) {
    return (
      <div className="history-section">
        <div className="history-header">
          <History size={16} />
          <span>History</span>
        </div>
        <div className="history-empty">
          <p>No saved dashboards yet.</p>
          <p className="history-empty-hint">Generate a dashboard to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-section">
      <div className="history-header">
        <History size={16} />
        <span>History ({dashboards.length})</span>
      </div>
      <div className="history-list">
        {dashboards.map((d) => (
          <div
            key={d.id}
            className="history-item"
            onClick={() => handleLoad(d.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleLoad(d.id);
            }}
          >
            <div className="history-item-content">
              <p className="history-query">{d.query}</p>
              <div className="history-meta">
                <Clock size={11} />
                <span>{formatTime(d.timestamp)}</span>
              </div>
            </div>
            <div className="history-actions">
              <button
                className="history-delete-btn"
                onClick={(e) => handleDelete(d.id, e)}
                aria-label="Delete dashboard"
              >
                <Trash2 size={13} />
              </button>
              <ChevronRight size={14} className="history-arrow" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
