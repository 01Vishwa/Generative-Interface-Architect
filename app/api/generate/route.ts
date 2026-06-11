import { NextResponse } from "next/server";
import { catalogToPrompt } from "@/lib/catalogToPrompt";
import { DEFAULT_CATALOG } from "@/lib/catalog";
import type { FormatType, CatalogDefinition } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { prompt, format, apiKey } = (await req.json()) as {
      prompt: string;
      format: FormatType;
      apiKey?: string;
    };

    // Try request-provided key first, then env variable
    const token = apiKey || process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "No API key provided. Please set your GitHub token in the settings." },
        { status: 401 }
      );
    }

    const catalog: CatalogDefinition = DEFAULT_CATALOG;
    const systemPrompt = catalogToPrompt(catalog, format);

    // Try streaming first
    try {
      const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 4096,
          stream: true,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("GitHub Models API error:", response.status, errorBody);

        // Fallback to non-streaming
        return await nonStreamingFallback(token, systemPrompt, prompt, format);
      }

      // Return the SSE stream directly
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                controller.close();
                break;
              }
              controller.enqueue(value);
            }
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (streamError) {
      console.warn("Streaming failed, falling back to non-streaming:", streamError);
      return await nonStreamingFallback(token, systemPrompt, prompt, format);
    }
  } catch (error: any) {
    console.error("Generate API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate" },
      { status: 500 }
    );
  }
}

async function nonStreamingFallback(
  token: string,
  systemPrompt: string,
  prompt: string,
  format: FormatType
) {
  const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Non-streaming API error:", response.status, errorBody);
    return NextResponse.json(
      { error: `API error: ${response.status}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    let parsed = JSON.parse(content);

    // Handle A2UI array wrapping
    if (format === "a2ui" && !Array.isArray(parsed)) {
      if (Array.isArray(parsed.components)) {
        parsed = parsed.components;
      } else if (Array.isArray(parsed.messages)) {
        parsed = parsed.messages;
      } else {
        const firstArray = Object.values(parsed).find(Array.isArray);
        if (firstArray) parsed = firstArray;
      }
    }

    return NextResponse.json({ spec: parsed });
  } catch {
    return NextResponse.json(
      { error: "Failed to parse generated JSON" },
      { status: 500 }
    );
  }
}
