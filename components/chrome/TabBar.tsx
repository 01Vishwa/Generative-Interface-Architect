"use client";

import React from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  size?: "sm" | "md";
  className?: string;
}

export default function TabBar({
  tabs,
  activeTab,
  onTabChange,
  size = "sm",
  className = "",
}: TabBarProps) {
  return (
    <div
      className={`flex items-center bg-gray-50/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative flex items-center gap-1.5 px-3 transition-all
            ${size === "sm" ? "py-2 text-[11px]" : "py-2.5 text-xs"}
            ${
              activeTab === tab.id
                ? "text-blue-600 dark:text-blue-400 font-semibold"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
            }
          `}
        >
          {tab.icon && <span className="opacity-80">{tab.icon}</span>}
          <span className="uppercase tracking-wider">{tab.label}</span>
          {tab.badge !== undefined && (
            <span
              className={`
                text-[9px] font-bold px-1.5 py-0.5 rounded-full
                ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }
              `}
            >
              {tab.badge}
            </span>
          )}

          {/* Active indicator */}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-blue-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
