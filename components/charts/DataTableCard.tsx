"use client";

/**
 * Data Table Card Component
 * 
 * Renders a styled table with alternating row colors,
 * sticky header, and horizontal scroll for wide datasets.
 */

import { useState } from "react";
import type { TableChart } from "@/lib/dashboard-schema";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableCardProps extends TableChart {
  index?: number;
}

const PAGE_SIZE = 10;

export default function DataTableCard({
  title,
  columns,
  rows,
  index = 0,
}: DataTableCardProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const displayedRows = rows.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

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
            {displayedRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="table-pagination">
          <span className="pagination-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="pagination-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="pagination-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
