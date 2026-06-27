import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_PERSONAS, type LLMPersona } from "@/lib/store/useLLMStore";

export const runtime = "edge";

/**
 * POST /api/llm — Multi-provider streaming LLM endpoint.
 * Receives a prompt + persona config and streams responses via SSE.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      systemPrompt,
      personaId,
      apiKey,
      conversationMessages = [],
      stream = true,
    } = body as {
      prompt: string;
      systemPrompt: string;
      personaId: string;
      apiKey: string;
      conversationMessages?: { role: string; content: string }[];
      stream?: boolean;
    };

    // Resolve persona
    const persona: LLMPersona =
      DEFAULT_PERSONAS.find((p) => p.id === personaId) || DEFAULT_PERSONAS[0];

    if (!apiKey && persona.provider !== "ollama") {
      return NextResponse.json(
        { error: "No API key provided" },
        { status: 401 }
      );
    }

    // Build messages array
    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    if (conversationMessages.length > 0) messages.push(...conversationMessages);
    messages.push({ role: "user", content: prompt });

    // Resolve provider URL and headers
    const { url, headers, requestBody } = buildProviderRequest(
      persona,
      apiKey,
      messages,
      stream
    );

    // Proxy request to provider
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Provider error (${response.status}): ${errText}` },
        { status: response.status }
      );
    }

    if (stream && response.body) {
      // Stream SSE through to client
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming: return JSON
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("LLM API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── Provider Request Builder ────────────────────────────────────────────────

function buildProviderRequest(
  persona: LLMPersona,
  apiKey: string,
  messages: { role: string; content: string }[],
  stream: boolean
) {
  const providers: Record<
    string,
    () => { url: string; headers: Record<string, string>; requestBody: Record<string, unknown> }
  > = {
    github: () => ({
      url: "https://models.inference.ai.azure.com/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      requestBody: {
        model: persona.model,
        messages,
        temperature: persona.temperature,
        max_tokens: persona.maxTokens,
        stream,
      },
    }),

    openrouter: () => ({
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://genui.dev",
        "X-Title": "GenUI Studio",
      },
      requestBody: {
        model: persona.model,
        messages,
        temperature: persona.temperature,
        max_tokens: persona.maxTokens,
        stream,
      },
    }),

    openai: () => ({
      url: "https://api.openai.com/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      requestBody: {
        model: persona.model,
        messages,
        temperature: persona.temperature,
        max_tokens: persona.maxTokens,
        stream,
      },
    }),

    anthropic: () => ({
      url: "https://api.anthropic.com/v1/messages",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      requestBody: {
        model: persona.model,
        system: messages.find((m) => m.role === "system")?.content || "",
        messages: messages.filter((m) => m.role !== "system"),
        temperature: persona.temperature,
        max_tokens: persona.maxTokens,
        stream,
      },
    }),

    ollama: () => ({
      url: "http://localhost:11434/api/chat",
      headers: { "Content-Type": "application/json" },
      requestBody: {
        model: persona.model,
        messages,
        stream,
        options: { temperature: persona.temperature },
      },
    }),
  };

  const builder = providers[persona.provider] || providers.openai;
  return builder();
}
