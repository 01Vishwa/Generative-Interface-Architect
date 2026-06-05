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
      {/* Dashboard Title */}
      <h2 className="dashboard-title">{descriptor.title}</h2>

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
          {descriptor.charts.map((chart, i) => renderChart(chart, i))}
        </div>
      )}

      {/* Insight Banner */}
      {descriptor.insight && <InsightBanner text={descriptor.insight} />}
    </div>
  );
}
