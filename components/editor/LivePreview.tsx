"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { useUIStore } from "@/lib/store/useUIStore";
import { Monitor, Smartphone, Tablet, RefreshCcw } from "lucide-react";

type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export default function LivePreview() {
  const irDocument = useSpecStore((s) => s.irDocument);
  const selectNode = useSpecStore((s) => s.selectNode);
  const theme = useUIStore((s) => s.theme);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const [consoleMessages, setConsoleMessages] = useState<
    { level: string; message: string; timestamp: number }[]
  >([]);

  // Send the spec to the iframe when it changes
  useEffect(() => {
    if (!isLoaded || !iframeRef.current || !irDocument) return;

    const iframe = iframeRef.current;
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: "UPDATE_SPEC", payload: irDocument },
        "*"
      );
    }
  }, [irDocument, isLoaded]);

  // Send theme to sandbox
  useEffect(() => {
    if (!isLoaded || !iframeRef.current) return;
    iframeRef.current.contentWindow?.postMessage(
      { type: "SET_THEME", payload: { theme } },
      "*"
    );
  }, [theme, isLoaded]);

  // Listen for messages from sandbox (bidirectional selection, console)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};

      switch (type) {
        case "NODE_SELECTED":
          if (payload?.nodeId) {
            selectNode(payload.nodeId);
          }
          break;

        case "CONSOLE_MESSAGE":
          setConsoleMessages((prev) => [...prev.slice(-99), payload]);
          break;

        case "SANDBOX_READY":
          // Re-send current spec after sandbox initialization
          if (iframeRef.current?.contentWindow && irDocument) {
            iframeRef.current.contentWindow.postMessage(
              { type: "UPDATE_SPEC", payload: irDocument },
              "*"
            );
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [selectNode, irDocument]);

  // Highlight a node in the sandbox when selected in the editor
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  useEffect(() => {
    if (!isLoaded || !iframeRef.current) return;
    iframeRef.current.contentWindow?.postMessage(
      { type: "HIGHLIGHT_NODE", payload: { nodeId: selectedNodeId } },
      "*"
    );
  }, [selectedNodeId, isLoaded]);

  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setIsLoaded(false);
    }
  }, []);

  return (
    <div className="w-full h-full bg-[#0a0e1a] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-[#0d1117]">
        {/* Device switcher */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-md p-0.5">
          {([
            { id: "desktop", icon: Monitor },
            { id: "tablet", icon: Tablet },
            { id: "mobile", icon: Smartphone },
          ] as const).map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setDevice(id)}
              className={`p-1.5 rounded transition-colors ${
                device === id
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              title={id}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={handleRefresh}
          className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded transition-colors"
          title="Refresh preview"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>

        {/* Console message count */}
        {consoleMessages.length > 0 && (
          <div className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
            {consoleMessages.length} msg{consoleMessages.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 relative bg-[#111827] flex items-start justify-center overflow-auto p-4">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Loading sandbox...</span>
            </div>
          </div>
        )}

        <div
          className="bg-white dark:bg-gray-950 rounded-lg shadow-2xl transition-all duration-300 overflow-hidden"
          style={{
            width: DEVICE_WIDTHS[device],
            maxWidth: "100%",
            height: device === "desktop" ? "100%" : "auto",
            minHeight: device !== "desktop" ? "600px" : undefined,
          }}
        >
          <iframe
            ref={iframeRef}
            src="/sandbox"
            className="w-full h-full border-none"
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => setIsLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}
