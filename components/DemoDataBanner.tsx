"use client";

/**
 * Demo Data Banner Component
 * 
 * "Try with demo data" button that auto-loads the sample CSV.
 */

import { useState } from "react";
import { Database, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { generateSchemaDoc, type SchemaDoc } from "@/lib/schema-generator";

interface DemoDataBannerProps {
  onDataLoaded: (
    data: Record<string, string>[],
    schemaDoc: SchemaDoc
  ) => void;
  hasData: boolean;
}

export default function DemoDataBanner({ onDataLoaded, hasData }: DemoDataBannerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const loadDemoData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/demo-data/sales_q3.csv");
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as Record<string, string>[];
          const schema = generateSchemaDoc("sales_q3.csv", data);
          onDataLoaded(data, schema);
          setIsLoading(false);
        },
        error: () => {
          setIsLoading(false);
        },
      });
    } catch {
      setIsLoading(false);
    }
  };

  if (hasData) return null;

  return (
    <div className="demo-banner">
      <div className="demo-banner-content">
        <Database size={18} />
        <div>
          <p className="demo-banner-title">No data loaded</p>
          <p className="demo-banner-hint">Upload a CSV above or try with sample data</p>
        </div>
      </div>
      <button
        className="demo-load-btn"
        onClick={loadDemoData}
        disabled={isLoading}
        id="load-demo-btn"
      >
        {isLoading ? <Loader2 size={14} className="spinning" /> : null}
        {isLoading ? "Loading..." : "Load Demo Data"}
      </button>
    </div>
  );
}
