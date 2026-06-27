"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { X, Copy, Check, Share2, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";

export default function ShareModal() {
  const { shareModalOpen, setShareModalOpen, rawText, format } = useEditorStore();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!shareModalOpen) return null;

  const generateLink = async () => {
    setLoading(true);
    setError(null);
    try {
      // Create a unique room ID
      const roomId = crypto.randomUUID();
      
      // Save initial state to Supabase
      const { error: dbError } = await supabase.from('workspaces').insert({
        id: roomId,
        format,
        spec: rawText,
      });

      // If table doesn't exist (since we didn't run migrations), we fallback to base64
      // for the sake of the demo, but in production it relies on the DB.
      let url = "";
      if (dbError) {
        console.warn("Supabase error (falling back to base64):", dbError.message);
        const payload = JSON.stringify({ format, spec: rawText });
        const encoded = btoa(unescape(encodeURIComponent(payload)));
        url = `${window.location.origin}/?share=${encoded}`;
      } else {
        url = `${window.location.origin}/?room=${roomId}`;
      }
      
      setShareUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShareModalOpen(false)}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            Share Workspace
          </h2>
          <button
            onClick={() => setShareModalOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-6">
          {!shareUrl ? (
            <div className="text-center w-full">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Generate a unique, persistent link to collaborate on this workspace or share it with others.
              </p>
              <button
                onClick={generateLink}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                Generate Link
              </button>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-6">
              {/* QR Code */}
              <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <QRCodeSVG value={shareUrl} size={160} />
              </div>
              
              {/* URL */}
              <div className="w-full relative group">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full pr-24 pl-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-600 dark:text-gray-300 outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1.5 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
