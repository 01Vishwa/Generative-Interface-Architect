"use client";

/**
 * Main Dashboard Page
 * 
 * Orchestrates all components:
 *   - Sidebar: CSV upload, schema preview, dashboard history
 *   - Main: query input, dashboard renderer, JSON inspector
 * 
 * State management is co-located here (lifted state pattern)
 * since this is a single-page application.
 */

import { useState, useCallback, useRef } from "react";
import { LayoutDashboard, AlertCircle } from "lucide-react";
import type { DashboardDescriptor } from "@/lib/dashboard-schema";
import type { SchemaDoc } from "@/lib/schema-generator";
import type { StoredDashboard } from "@/lib/dashboard-store";
import { saveDashboard } from "@/lib/dashboard-store";
import DataUploader from "@/components/DataUploader";
import SchemaPreview from "@/components/SchemaPreview";
import DemoDataBanner from "@/components/DemoDataBanner";
import DashboardHistory from "@/components/DashboardHistory";
import QueryInput from "@/components/QueryInput";
import DashboardRenderer from "@/components/DashboardRenderer";
import JsonInspector from "@/components/JsonInspector";
import SkeletonDashboard from "@/components/SkeletonDashboard";

// ─── Types ───────────────────────────────────────────────────────────────

interface GenerationResult {
  descriptor: DashboardDescriptor;
  raw: string;
  retried?: boolean;
}

interface GenerationError {
  code: string;
  message: string;
  details?: unknown;
}

export default function DashboardPage() {
  // Data state
  const [csvData, setCsvData] = useState<Record<string, string>[] | null>(null);
  const [schemaDoc, setSchemaDoc] = useState<SchemaDoc | null>(null);

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<GenerationError | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");

  // History refresh trigger
  const historyRef = useRef(0);
  const [, setHistoryTick] = useState(0);

  // ─── Data Loading ─────────────────────────────────────────────────────

  const handleDataLoaded = useCallback(
    (data: Record<string, string>[], schema: SchemaDoc) => {
      setCsvData(data);
      setSchemaDoc(schema);
      setError(null);
    },
    []
  );

  // ─── Dashboard Generation ─────────────────────────────────────────────

  const handleGenerate = useCallback(
    async (query: string) => {
      if (!schemaDoc) return;

      setIsLoading(true);
      setError(null);
      setResult(null);
      setLastQuery(query);

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            schemaDoc: schemaDoc.schemaText,
            csvData: csvData?.slice(0, 100), // Send first 100 rows max
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? {
            code: "UNKNOWN",
            message: "An unexpected error occurred",
          });
          return;
        }

        const genResult: GenerationResult = {
          descriptor: data.descriptor,
          raw: typeof data.raw === "string"
            ? data.raw
            : JSON.stringify(data.descriptor, null, 2),
          retried: data.retried,
        };

        setResult(genResult);

        // Save to history
        saveDashboard(query, genResult.descriptor, schemaDoc.fileName);
        historyRef.current += 1;
        setHistoryTick(historyRef.current);
      } catch (e) {
        setError({
          code: "NETWORK_ERROR",
          message: e instanceof Error ? e.message : "Failed to connect to the server",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [schemaDoc, csvData]
  );

  // ─── History Loading ──────────────────────────────────────────────────

  const handleHistoryLoad = useCallback((dashboard: StoredDashboard) => {
    setResult({
      descriptor: dashboard.descriptor,
      raw: JSON.stringify(dashboard.descriptor, null, 2),
    });
    setLastQuery(dashboard.query);
    setError(null);
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">G</div>
          <h1>Generative Interface Architect</h1>
        </div>
        <span className="app-version">v1.0 • Declarative Dashboard</span>
      </header>

      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <p className="sidebar-section-title">Data Source</p>
          <DataUploader
            onDataLoaded={handleDataLoaded}
            currentFile={schemaDoc?.fileName}
          />
        </div>

        {schemaDoc && (
          <div>
            <p className="sidebar-section-title">Detected Schema</p>
            <SchemaPreview schema={schemaDoc} />
          </div>
        )}

        <DashboardHistory
          key={historyRef.current}
          onLoad={handleHistoryLoad}
        />
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Demo data banner — shown when no data is loaded */}
        <DemoDataBanner onDataLoaded={handleDataLoaded} hasData={!!csvData} />

        {/* Query Input */}
        <QueryInput
          onSubmit={handleGenerate}
          isLoading={isLoading}
          disabled={!csvData}
        />

        {/* Loading State */}
        {isLoading && <SkeletonDashboard />}

        {/* Error State */}
        {error && !isLoading && (
          <div className="error-display">
            <AlertCircle size={20} className="error-display-icon" />
            <div className="error-display-content">
              <h4>Generation Failed</h4>
              <p>{error.message}</p>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {result && !isLoading && (
          <>
            <DashboardRenderer descriptor={result.descriptor} />
            <JsonInspector
              json={JSON.stringify(result.descriptor, null, 2)}
              retried={result.retried}
            />
          </>
        )}

        {/* Empty State */}
        {!result && !isLoading && !error && csvData && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <LayoutDashboard size={32} />
            </div>
            <h3>Ask a question about your data</h3>
            <p>
              Type a natural language query above, and the AI will generate a
              personalized dashboard with KPIs, charts, and insights.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
