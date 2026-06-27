import React from "react";
import Header from "@/components/chrome/Header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GenUI Studio",
  description: "Advanced Generative UI Architect IDE",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden selection:bg-blue-500/30"
      style={{
        background: "var(--surface-0)",
        color: "var(--text-primary)",
      }}
    >
      {/* Chrome header */}
      <Header />

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
