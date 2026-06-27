"use client";

import React from "react";
import { useEditorStore } from "@/lib/editor-store";
import { Download } from "lucide-react";

export default function ExportMenu() {
  const { setExportModalOpen } = useEditorStore();

  return (
    <button
      onClick={() => setExportModalOpen(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
      Export
    </button>
  );
}
