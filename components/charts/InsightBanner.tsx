"use client";

/**
 * Insight Banner Component
 * 
 * Displays the LLM's textual insight as a highlighted banner
 * with gradient border and icon.
 */

import { Lightbulb } from "lucide-react";

interface InsightBannerProps {
  text: string;
}

export default function InsightBanner({ text }: InsightBannerProps) {
  if (!text) return null;

  return (
    <div className="insight-banner">
      <Lightbulb size={18} className="insight-icon" />
      <p className="insight-text">{text}</p>
    </div>
  );
}
