"use client";

import dynamic from "next/dynamic";
import React from "react";

const PlaygroundClient = dynamic(() => import("./PlaygroundClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-2xl">⚡</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-500">
          Loading Playground...
        </h3>
      </div>
    </div>
  ),
});

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
