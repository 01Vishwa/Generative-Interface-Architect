"use client";

/**
 * Data Table Card Component
 * 
 * Renders a styled table with alternating row colors,
 * sticky header, and horizontal scroll for wide datasets.
 */

import type { TableChart } from "@/lib/dashboard-schema";

interface DataTableCardProps extends TableChart {
  index?: number;
}

export default function DataTableCard({
  title,
  columns,
  rows,
  index = 0,
}: DataTableCardProps) {
  return (
    <div className="chart-card" style={{ animationDelay: `${index * 100}ms` }}>
      <h3 className="chart-title">{title}</h3>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
