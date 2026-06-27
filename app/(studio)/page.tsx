"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/useWorkspace";

export default function StudioDefaultPage() {
  const router = useRouter();
  const { workspaceId } = useWorkspace({ autoSaveInterval: 0 }); // Don't auto-save just yet

  useEffect(() => {
    if (workspaceId) {
      router.replace(`/${workspaceId}`);
    }
  }, [workspaceId, router]);

  return (
    <div className="flex items-center justify-center w-full h-full bg-[#0a0e1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400">Loading workspace...</p>
      </div>
    </div>
  );
}
