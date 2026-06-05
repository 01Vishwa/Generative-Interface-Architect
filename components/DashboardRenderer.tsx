"use client";

/**
 * Dashboard Renderer
 * 
 * The core rendering engine. Takes a validated DashboardDescriptor
 * and maps each entry to a real component using a simple switch.
 * 
 * Design principle: the renderer is deliberately "dumb" — it just
 * maps types to components. The LLM decides WHAT to show, the
 * renderer decides HOW to show it.
 */

import type { DashboardDescriptor, Chart } from "@/lib/dashboard-schema";
import KPICard from "./charts/KPICard";
import BarChartCard from "./charts/BarChartCard";
import LineChartCard from "./charts/LineChartCard";
import PieChartCard from "./charts/PieChartCard";
import ScatterChartCard from "./charts/ScatterChartCard";
import DataTableCard from "./charts/DataTableCard";
import FallbackCard from "./charts/FallbackCard";
import InsightBanner from "./charts/InsightBanner";
import ChartErrorBoundary from "./ChartErrorBoundary";

interface DashboardRendererProps {
  descriptor: DashboardDescriptor;
}

/**
 * Renders a chart component based on its type discriminator.
 * Unknown types fall through to FallbackCard — never crashes.
 */
function renderChart(chart: Chart, index: number) {
  switch (chart.type) {
    case "bar":
      return <BarChartCard key={`chart-${index}`} {...chart} index={index} />;
    case "line":
      return <LineChartCard key={`chart-${index}`} {...chart} index={index} />;
    case "pie":
      return <PieChartCard key={`chart-${index}`} {...chart} index={index} />;
    case "scatter":
      return <ScatterChartCard key={`chart-${index}`} {...chart} index={index} />;
    case "table":
      return <DataTableCard key={`chart-${index}`} {...chart} index={index} />;
    default:
      return (
        <FallbackCard
          key={`chart-${index}`}
          data={chart as unknown as Record<string, unknown>}
          index={index}
        />
      );
  }
}

export default function DashboardRenderer({ descriptor }: DashboardRendererProps) {
  const layoutClass = `layout-${descriptor.layout}`;

  return (
    <div className="dashboard-rendered">
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="dashboard-title">{descriptor.title}</h2>
        <button
          onClick={() => window.print()}
          className="demo-load-btn"
          style={{ padding: "8px 16px", fontSize: "12px", gap: "6px" }}
          aria-label="Export Dashboard"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export
        </button>
      </div>

      {/* KPI Row */}
      {descriptor.kpis.length > 0 && (
        <div className="kpi-row">
          {descriptor.kpis.map((kpi, i) => (
            <KPICard key={`kpi-${i}`} {...kpi} index={i} />
          ))}
        </div>
      )}

      {/* Charts Grid */}
      {descriptor.charts.length > 0 && (
        <div className={`charts-grid ${layoutClass}`}>
          {descriptor.charts.map((chart, i) => (
            <ChartErrorBoundary key={`error-boundary-${i}`}>
              {renderChart(chart, i)}
            </ChartErrorBoundary>
          ))}
        </div>
      )}

      {/* Insight Banner */}
      {descriptor.insight && <InsightBanner text={descriptor.insight} />}
    </div>
  );
}
