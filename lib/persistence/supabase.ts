// ─── Supabase Persistence & Sync Layer ───────────────────────────────────────
// Handles workspace syncing, share links, and real-time collaboration
// with Supabase. Falls back gracefully when offline.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Client Initialization ───────────────────────────────────────────────────

let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn("Supabase not configured — running in local-only mode");
    return null;
  }

  supabase = createClient(url, anonKey);
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ─── Workspace Operations ────────────────────────────────────────────────────

export interface RemoteWorkspace {
  id: string;
  name: string;
  raw_text: string;
  format: string;
  created_at: string;
  updated_at: string;
  is_shared: boolean;
  share_id: string | null;
  settings: Record<string, unknown>;
}

export async function syncWorkspaceToRemote(workspace: {
  id: string;
  name: string;
  rawText: string;
  format: string;
  settings?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  const client = getClient();
  if (!client) return { success: false, error: "Supabase not configured" };

  try {
    const { error } = await client.from("workspaces").upsert({
      id: workspace.id,
      name: workspace.name,
      raw_text: workspace.rawText,
      format: workspace.format,
      settings: workspace.settings || {},
      updated_at: new Date().toISOString(),
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function loadWorkspaceFromRemote(
  id: string
): Promise<RemoteWorkspace | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as RemoteWorkspace;
  } catch {
    return null;
  }
}

export async function listRemoteWorkspaces(): Promise<RemoteWorkspace[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("workspaces")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data as RemoteWorkspace[];
  } catch {
    return [];
  }
}

// ─── Share Links ─────────────────────────────────────────────────────────────

export interface ShareRecord {
  id: string;
  workspace_id: string;
  payload: string;
  access: "view" | "edit" | "fork";
  created_at: string;
  expires_at: string | null;
}

export async function createShareLink(
  workspaceId: string,
  rawText: string,
  access: "view" | "edit" | "fork" = "view"
): Promise<{ shareId: string; url: string } | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const shareId = generateShareId();

    const { error } = await client.from("share_links").insert({
      id: shareId,
      workspace_id: workspaceId,
      payload: rawText,
      access,
    });

    if (error) {
      console.error("Failed to create share link:", error);
      return null;
    }

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return {
      shareId,
      url: `${baseUrl}/?room=${shareId}`,
    };
  } catch {
    return null;
  }
}

export async function loadShareLink(
  shareId: string
): Promise<ShareRecord | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("share_links")
      .select("*")
      .eq("id", shareId)
      .single();

    if (error || !data) return null;
    return data as ShareRecord;
  } catch {
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateShareId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(36))
    .join("")
    .slice(0, 12);
}
