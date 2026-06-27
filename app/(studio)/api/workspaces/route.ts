import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/workspaces — List all workspaces
 * POST /api/workspaces — Create/update a workspace
 * DELETE /api/workspaces?id=xxx — Delete a workspace
 * 
 * Note: Since IndexedDB is client-side, this route serves as a Supabase
 * sync endpoint. For local-only mode, the client uses hooks directly.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    // TODO: Load from Supabase when sync is enabled
    return NextResponse.json({ error: "Server-side workspace load requires Supabase config" }, { status: 501 });
  }

  return NextResponse.json({ workspaces: [], message: "Server-side listing requires Supabase config" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, rawText, format, settings, shareId } = body;

    if (!id || !rawText) {
      return NextResponse.json({ error: "id and rawText are required" }, { status: 400 });
    }

    // TODO: Save to Supabase when NEXT_PUBLIC_SUPABASE_URL is configured
    const workspace = {
      id,
      name: name || `Workspace ${id.slice(0, 6)}`,
      rawText,
      format: format || "json-render",
      settings: settings || {},
      shareId: shareId || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return NextResponse.json({ workspace, synced: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save workspace" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
  }

  // TODO: Delete from Supabase when configured
  return NextResponse.json({ deleted: id, synced: false });
}
