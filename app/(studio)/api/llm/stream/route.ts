import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_PERSONAS } from "@/lib/store/useLLMStore";
import { streamGenUI } from "@/lib/llm/gateway";
import type { ProviderId } from "@/lib/llm/providers";



export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      systemPrompt,
      personaId,
      apiKey,
      conversationMessages = [],
    } = body;

    const persona = DEFAULT_PERSONAS.find((p) => p.id === personaId) || DEFAULT_PERSONAS[0];

    if (!apiKey && persona.provider !== "ollama") {
      return NextResponse.json({ error: "No API key provided" }, { status: 401 });
    }

    const messages: any[] = [];
    if (conversationMessages.length > 0) {
      messages.push(...conversationMessages.map((m: any) => ({ role: m.role, content: m.content })));
    }
    messages.push({ role: "user", content: prompt });

    const result = await streamGenUI(
      persona.model,
      persona.provider as ProviderId,
      apiKey,
      messages,
      systemPrompt || persona.systemPrompt
    );

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("LLM API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
