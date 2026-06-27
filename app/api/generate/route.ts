/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { catalogToPrompt } from "@/lib/catalogToPrompt";
import { DEFAULT_CATALOG } from "@/lib/catalog";
import type { FormatType, CatalogDefinition } from "@/lib/types";
import { generateText, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export async function POST(req: Request) {
  try {
    const { prompt, format, apiKey, provider = "openai" } = (await req.json()) as {
      prompt: string;
      format: FormatType;
      apiKey?: string;
      provider?: "openai" | "anthropic";
    };

    const token = apiKey || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!token) {
      return NextResponse.json(
        { error: "No API key provided. Please provide one in the settings." },
        { status: 401 }
      );
    }

    const catalog: CatalogDefinition = DEFAULT_CATALOG;
    const systemPrompt = catalogToPrompt(catalog, format);

    let aiProvider;
    let modelName = "";

    if (provider === "anthropic") {
      const anthropic = createAnthropic({ apiKey: token });
      aiProvider = anthropic("claude-3-5-sonnet-20240620");
      modelName = "claude-3-5-sonnet";
    } else {
      const openai = createOpenAI({ apiKey: token });
      aiProvider = openai("gpt-4o");
      modelName = "gpt-4o";
    }

    // Since we need structured JSON format, we'll use generateText for simplicity
    // although streamText supports tool calls for streaming JSON. For GenUI we want raw JSON text.
    
    const result = await generateText({
      model: aiProvider,
      system: systemPrompt,
      prompt: prompt,
      temperature: 0.1,
    });

    const content = result.text || "";

    try {
      // Extract JSON if wrapped in markdown blocks
      const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
      let parsed = JSON.parse(jsonStr);

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
    } catch (parseError) {
      return NextResponse.json(
        { error: "Failed to parse generated JSON", content },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Generate API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate" },
      { status: 500 }
    );
  }
}
