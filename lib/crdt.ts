import * as Y from "yjs";
import { SupabaseProvider } from "y-supabase";
import { supabase } from "./supabase";

export const doc = new Y.Doc();

export const yText = doc.getText("spec");

export const undoManager = new Y.UndoManager(yText);

// Initialize provider lazily or when a room is joined
export let provider: SupabaseProvider | null = null;

export const joinRoom = (roomId: string) => {
  if (provider) {
    provider.destroy();
  }
  provider = new SupabaseProvider(doc, supabase, {
    channel: roomId,
    tableName: "yjs_documents",
    columnName: "document",
  });
};

export const relativeTime = (timestamp: number): string => {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysDifference === 0) {
    const hoursDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60));
    if (hoursDifference === 0) {
      const minutesDifference = Math.round((timestamp - Date.now()) / (1000 * 60));
      return rtf.format(minutesDifference, "minute");
    }
    return rtf.format(hoursDifference, "hour");
  }
  return rtf.format(daysDifference, "day");
};
