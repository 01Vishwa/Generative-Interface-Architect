"use client";

/**
 * Skeleton Dashboard Component
 * 
 * Shimmer loading skeleton matching the dashboard grid layout.
 * Shown while the LLM is generating the dashboard descriptor.
 */

export default function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard">
      {/* Skeleton title */}
      <div className="skeleton-title shimmer" />

      {/* Skeleton KPIs */}
      <div className="skeleton-kpi-row">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-kpi shimmer" />
        ))}
      </div>

      {/* Skeleton charts */}
      <div className="skeleton-charts-grid">
        <div className="skeleton-chart shimmer" />
        <div className="skeleton-chart shimmer" />
      </div>

      {/* Skeleton insight */}
      <div className="skeleton-insight shimmer" />

      <div className="skeleton-label">
        <span className="pulse-dot" />
        Generating dashboard...
      </div>
    </div>
  );
}
