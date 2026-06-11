"use client";

import React, { useRef, useEffect, useCallback } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEditorStore } from "@/lib/editor-store";
import { catalogToJsonSchema } from "@/lib/catalogToJsonSchema";
import { AlertCircle, Check } from "lucide-react";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export default function SpecEditor() {
  const {
    rawText,
    format,
    catalog,
    validationErrors,
    setRawText,
    setParsedSpec,
    setValidationErrors,
  } = useEditorStore();

  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const isExternalUpdate = useRef(false);

  // Store the rawText in a ref so onChange callback always has latest
  const rawTextRef = useRef(rawText);
  rawTextRef.current = rawText;

  // ─── Monaco JSON Schema ────────────────────────────────────────────────

  useEffect(() => {
    if (!monaco) return;

    const schema = catalogToJsonSchema(catalog, format);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (monaco.languages.json as any).jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: "https://genui-playground.local/schema.json",
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
      // Use executeEdits to preserve cursor/undo history
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

  // ─── onChange handler with 300ms debounce ──────────────────────────────

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (!value || isExternalUpdate.current) return;

      setRawText(value);

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          const parsed = JSON.parse(value);
          setParsedSpec(parsed);
        } catch {
          setParsedSpec(null);
        }
      }, 300);
    },
    [setRawText, setParsedSpec]
  );

  const handleMount = useCallback((editor: any) => {
    editorRef.current = editor;

    // Bind Cmd+Shift+F to format
    editor.addAction({
      id: "format-json",
      label: "Format JSON",
      keybindings: [
        // Monaco keybindings: Cmd/Ctrl + Shift + F
        editor._standaloneKeybindingService
          ? undefined
          : undefined,
      ],
      run: () => {
        editor.getAction("editor.action.formatDocument")?.run();
      },
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50/80">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Editor
          </h2>
          <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            {format}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {validationErrors > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              {validationErrors} {validationErrors === 1 ? "error" : "errors"}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
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
          theme="vs-light"
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
          }}
        />
      </div>
    </div>
  );
}
