"use client";

/**
 * Query Input Component
 * 
 * Chat-style input bar with loading state, sample queries,
 * and keyboard shortcut (Enter to submit).
 */

import { useState, useRef } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const SAMPLE_QUERIES = [
  "Show me revenue by region",
  "What are the top products by sales?",
  "Give me a KPI overview of all metrics",
  "Revenue trend over time",
  "Compare sales channels",
];

export default function QueryInput({ onSubmit, isLoading, disabled }: QueryInputProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed || isLoading || disabled) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="query-input-section">
      <div className="query-input-wrapper">
        <Sparkles size={18} className="query-input-icon" />
        <textarea
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Upload a CSV file first..." : "Ask about your data..."}
          className="query-textarea"
          disabled={isLoading || disabled}
          rows={1}
          id="query-input"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || disabled || !query.trim()}
          className="query-submit-btn"
          id="generate-btn"
          aria-label="Generate dashboard"
        >
          {isLoading ? (
            <Loader2 size={18} className="spinning" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      {!disabled && !isLoading && (
        <div className="sample-queries">
          {SAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              className="sample-query-chip"
              onClick={() => {
                setQuery(q);
                inputRef.current?.focus();
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
