/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef, useEffect, useCallback } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { useUIStore } from "@/lib/store/useUIStore";
import { catalogToJsonSchema } from "@/lib/catalogToJsonSchema";
import { AlertCircle, Check } from "lucide-react";
import customTheme from "@/styles/monaco-theme.json";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export default function SpecEditor() {
  const rawText = useSpecStore((s) => s.rawText);
  const format = useSpecStore((s) => s.format);
  const catalog = useSpecStore((s) => s.catalog);
  const validationErrors = useSpecStore((s) => s.validationErrors);
  
  const setRawText = useSpecStore((s) => s.setRawText);
  const syncTextToIR = useSpecStore((s) => s.syncTextToIR);
  const setValidationErrors = useSpecStore((s) => s.setValidationErrors);
  
  const theme = useUIStore((s) => s.theme);
  const editorTheme = theme === "dark" ? "genui-dark" : "vs-light";

  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const isExternalUpdate = useRef(false);

  // ─── Monaco JSON Schema ────────────────────────────────────────────────

  useEffect(() => {
    if (!monaco) return;

    monaco.editor.defineTheme("genui-dark", customTheme as any);

    const schema = catalogToJsonSchema(catalog, format);

     
    (monaco.languages.json as any).jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: "https://genui-studio.local/schema.json",
          fileMatch: ["*"],
          schema: schema as any,
        },
      ],
    });
  }, [monaco, format, catalog]);

  // ─── Sync external rawText changes into editor ─────────────────────────

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentValue = editor.getValue();
    if (currentValue !== rawText) {
      isExternalUpdate.current = true;
      const model = editor.getModel();
      if (model) {
        editor.executeEdits("external-update", [
          {
            range: model.getFullModelRange(),
            text: rawText,
          },
        ]);
      }
      isExternalUpdate.current = false;
    }
  }, [rawText]);

  // ─── Validation error tracking ────────────────────────────────────────

  useEffect(() => {
    if (!monaco) return;

    const disposable = monaco.editor.onDidChangeMarkers(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const model = editor.getModel();
      if (!model) return;
      const markers = monaco.editor.getModelMarkers({ resource: model.uri });
      const errorCount = markers.filter(
        (m: any) => m.severity === monaco.MarkerSeverity.Error
      ).length;
      setValidationErrors(errorCount);
    });

    return () => disposable.dispose();
  }, [monaco, setValidationErrors]);

  // ─── onChange handler with debounce ──────────────────────────────

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!value || isExternalUpdate.current) return;

      setRawText(value);

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        syncTextToIR();
      }, 300);
    },
    [setRawText, syncTextToIR]
  );

  const handleMount = useCallback((editor: any) => {
    editorRef.current = editor;

    // Bind Cmd+Shift+F to format
    editor.addAction({
      id: "format-json",
      label: "Format JSON",
      keybindings: [
        monaco ? monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF : 0
      ],
      run: () => {
        editor.getAction("editor.action.formatDocument")?.run();
      },
    });
  }, [monaco]);

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface-0)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Editor
          </h2>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: 'var(--text-info)', background: 'var(--bg-info)' }}>
            {format}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {validationErrors > 0 ? (
            <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ color: 'var(--text-danger)', background: 'var(--bg-danger)' }}>
              <AlertCircle className="w-3 h-3" />
              {validationErrors} errors
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ color: 'var(--text-success)', background: 'var(--bg-success)' }}>
              <Check className="w-3 h-3" />
              Valid
            </span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="json"
          value={rawText}
          onChange={handleChange}
          onMount={handleMount}
          theme={editorTheme}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            wordWrap: "on",
            formatOnPaste: true,
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "gutter",
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
            padding: { top: 12 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
}
