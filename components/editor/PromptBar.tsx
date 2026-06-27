/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { getApiKey } from "@/lib/history";
import { Sparkles, Loader2, Key } from "lucide-react";

export default function PromptBar() {
  const {
    format,
    setFormat,
    setRawText,
    setParsedSpec,
    isGenerating,
    setIsGenerating,
    setGenerationError,
    setApiKeyModalOpen,
  } = useEditorStore();

  const [prompt, setPrompt] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setApiKeyModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          format,
          apiKey,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Generation failed (${response.status})`);
      }

      // Check if streaming response
      if (response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  accumulated += parsed.choices[0].delta.content;
                  // Update editor in real time
                  setRawText(accumulated);
                  // Try to parse and update canvas
                  try {
                    const specParsed = JSON.parse(accumulated);
                    setParsedSpec(specParsed);
                  } catch {
                    // Not valid JSON yet, continue accumulating
                  }
                }
              } catch {
                // Ignore parse errors in stream
              }
            }
          }
        }

        // Final parse after stream completes
        try {
          const finalSpec = JSON.parse(accumulated);
          setParsedSpec(finalSpec);
          setRawText(JSON.stringify(finalSpec, null, 2));
        } catch {
          // Keep accumulated text as-is
        }
      } else {
        // Non-streaming fallback
        const data = await response.json();
        if (data.spec) {
          const text = JSON.stringify(data.spec, null, 2);
          setRawText(text);
          setParsedSpec(data.spec);
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setGenerationError(error.message);
        console.error("Generation error:", error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2.5 border-b border-gray-200">
      {/* Format tabs */}
      <div className="flex bg-gray-100 p-0.5 rounded-lg">
        <button
          onClick={() => setFormat("json-render")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            format === "json-render"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          json-render
        </button>
        <button
          onClick={() => setFormat("a2ui")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            format === "a2ui"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          A2UI
        </button>
      </div>

      {/* Generation input */}
      <form onSubmit={handleGenerate} className="flex-1 flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the UI you want to generate..."
            className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg pl-4 pr-4 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
            disabled={isGenerating}
          />
        </div>

        <button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-all shadow-sm shadow-blue-200"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate
            </>
          )}
        </button>
      </form>

      {/* API key indicator */}
      <button
        onClick={() => setApiKeyModalOpen(true)}
        className={`p-2 rounded-lg transition-colors ${
          getApiKey()
            ? "text-emerald-500 hover:bg-emerald-50"
            : "text-gray-400 hover:bg-gray-100"
        }`}
        title={getApiKey() ? "API key configured" : "Set API key"}
      >
        <Key className="w-4 h-4" />
      </button>
    </div>
  );
}
