"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLLMStream } from "@/hooks/useLLMStream";
import { Sparkles, StopCircle, ArrowUp, Loader2 } from "lucide-react";
import { useLLMStore } from "@/lib/store/useLLMStore";

export default function PromptBar() {
  const [prompt, setPrompt] = useState("");
  const { generate, abort, isGenerating } = useLLMStream();
  const streamProgress = useLLMStore((s) => s.streamProgress);
  const generationError = useLLMStore((s) => s.generationError);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      generate(prompt);
      setPrompt("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 pointer-events-none z-50">
      <div className="bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/20 pointer-events-auto overflow-hidden transition-all duration-300">
        
        {/* Progress Bar */}
        {isGenerating && (
          <div className="h-1 bg-gray-100 dark:bg-white/5 w-full">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${Math.max(5, streamProgress * 100)}%` }}
            />
          </div>
        )}

        {/* Error Banner */}
        {generationError && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs font-medium">
            {generationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
          <div className="flex items-center self-stretch pl-2">
            <div className={`p-2 rounded-xl ${isGenerating ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/10 text-blue-500'}`}>
              <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
            </div>
          </div>
          
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Generate or modify UI (e.g. 'Add a login form with email and password')"
            className="flex-1 bg-transparent border-none outline-none resize-none min-h-[44px] py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 max-h-[120px]"
            rows={1}
            disabled={isGenerating}
          />
          
          <div className="flex items-center self-stretch pr-1">
            {isGenerating ? (
              <button
                type="button"
                onClick={abort}
                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                title="Stop generation"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 text-white disabled:text-gray-500 rounded-xl transition-all disabled:cursor-not-allowed group"
              >
                <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
