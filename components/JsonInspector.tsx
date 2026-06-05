"use client";

/**
 * JSON Inspector Component
 * 
 * Collapsible panel showing the raw JSON descriptor
 * with syntax highlighting and copy-to-clipboard.
 */

import { useState } from "react";
import { Code2, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

interface JsonInspectorProps {
  json: string;
  retried?: boolean;
}

export default function JsonInspector({ json, retried }: JsonInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = json;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Simple syntax highlighting
  const highlighted = json
    .replace(/("[\w_]+")\s*:/g, '<span class="json-key">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span class="json-bool">$1</span>');

  return (
    <div className="json-inspector">
      <button
        className="json-inspector-toggle"
        onClick={() => setIsOpen(!isOpen)}
        id="json-inspector-toggle"
      >
        <Code2 size={16} />
        <span>JSON Descriptor</span>
        {retried && <span className="retry-badge">Retried</span>}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="json-inspector-body">
          <button
            className="json-copy-btn"
            onClick={handleCopy}
            aria-label="Copy JSON"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <pre
            className="json-content"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      )}
    </div>
  );
}
