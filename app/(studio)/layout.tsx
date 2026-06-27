import React from "react";
import Header from "@/components/chrome/Header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GenUI Studio",
  description: "Advanced Generative UI Architect IDE",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-[#0a0e1a] text-gray-900 dark:text-gray-100 selection:bg-blue-500/30">
      {/* Chrome header */}
      <Header />
      
      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Global Modals will go here, currently managed inside individual components or via global store if needed. We'll add them as we build the components. */}
    </div>
  );
}
