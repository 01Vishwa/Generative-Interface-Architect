import { NextRequest, NextResponse } from "next/server";
import { validateComponentDefinition } from "@/lib/registry/validator";

/**
 * POST /api/registry — Register a custom component
 * GET /api/registry — List registered components  
 * DELETE /api/registry?name=xxx — Unregister a component
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, definition, source = "custom" } = body;

    if (!name || !definition) {
      return NextResponse.json(
        { error: "name and definition are required" },
        { status: 400 }
      );
    }

    // Validate the component definition
    const errors = validateComponentDefinition(name, definition);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid component definition", validationErrors: errors },
        { status: 422 }
      );
    }

    // For npm source, we could resolve types from esm.sh
    if (source === "npm" && definition.npmPackage) {
      // TODO: Fetch type definitions from esm.sh or unpkg
      // const types = await fetchNpmTypes(definition.npmPackage);
    }

    return NextResponse.json({
      registered: true,
      name,
      source,
      version: definition.version || "1.0.0",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register component" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Registry state is managed client-side via Zustand.
  // This endpoint can be used for remote/shared registries.
  return NextResponse.json({
    message: "Registry is managed client-side. Use useRegistryStore for local access.",
    endpoints: {
      register: "POST /api/registry",
      unregister: "DELETE /api/registry?name=xxx",
    },
  });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "Component name is required" },
      { status: 400 }
    );
  }

  return NextResponse.json({ unregistered: name });
}
