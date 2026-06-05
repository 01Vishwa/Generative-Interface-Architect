/**
 * Dashboard Generation API Route
 * 
 * POST /api/generate
 * 
 * Receives a user query + data context, calls the LLM via GitHub Models
 * (OpenAI SDK pointing to GitHub's inference endpoint), validates the
 * response against the Zod schema, and returns the validated descriptor.
 * 
 * Retry strategy: if Zod validation fails, retries once with the error
 * message appended so the LLM can self-correct.
 * 
 * @module api/generate
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { validateDescriptor } from "@/lib/dashboard-schema";
import { buildSystemPrompt, buildRetryPrompt } from "@/lib/system-prompt";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GenerateRequest {
  query: string;
  schemaDoc: string;
  csvData?: Record<string, string>[];
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ─── LLM Client (Singleton) ─────────────────────────────────────────────────

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ENDPOINT = "https://models.github.ai/inference";
const MODEL = "openai/gpt-4.1";

function getClient(): OpenAI {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN environment variable is not set");
  }
  return new OpenAI({
    baseURL: ENDPOINT,
    apiKey: GITHUB_TOKEN,
  });
}

// ─── JSON Extraction ─────────────────────────────────────────────────────────

/**
 * Extracts JSON from the LLM response, handling cases where the model
 * wraps the output in markdown code fences despite being told not to.
 */
function extractJson(raw: string): unknown {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    cleaned = cleaned.slice(firstNewline + 1);
    const lastFence = cleaned.lastIndexOf("```");
    if (lastFence !== -1) {
      cleaned = cleaned.slice(0, lastFence);
    }
    cleaned = cleaned.trim();
  }

  // Strip leading/trailing non-JSON characters
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

// ─── Request Validation ──────────────────────────────────────────────────────

function validateRequest(body: unknown): GenerateRequest | ErrorResponse {
  if (!body || typeof body !== "object") {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body must be a JSON object",
      },
    };
  }

  const { query, schemaDoc } = body as Record<string, unknown>;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "query is required and must be a non-empty string",
      },
    };
  }

  if (!schemaDoc || typeof schemaDoc !== "string") {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "schemaDoc is required and must be a string",
      },
    };
  }

  return body as GenerateRequest;
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "PARSE_ERROR",
          message: "Invalid JSON in request body",
        },
      },
      { status: 400 }
    );
  }

  // Validate request shape
  const validated = validateRequest(body);
  if ("error" in validated) {
    return NextResponse.json(validated, { status: 422 });
  }

  const { query, schemaDoc } = validated;

  // Check API key
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message: "GITHUB_TOKEN is not configured. Add it to .env.local",
        },
      },
      { status: 500 }
    );
  }

  try {
    const client = getClient();
    const systemPrompt = buildSystemPrompt(schemaDoc);

    // ── First attempt ──────────────────────────────────────────────────────
    const firstResponse = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    const firstContent = firstResponse.choices[0]?.message?.content;
    if (!firstContent) {
      return NextResponse.json(
        {
          error: {
            code: "LLM_ERROR",
            message: "LLM returned an empty response",
          },
        },
        { status: 502 }
      );
    }

    // Try to parse and validate
    let parsed: unknown;
    try {
      parsed = extractJson(firstContent);
    } catch {
      // JSON parse failed — retry
      parsed = null;
    }

    if (parsed) {
      const result = validateDescriptor(parsed);
      if (result.success && result.data) {
        return NextResponse.json({
          descriptor: result.data,
          raw: firstContent,
        });
      }

      // ── Retry with error context ───────────────────────────────────────
      const retryMessage = buildRetryPrompt(query, result.error ?? "Unknown validation error");

      const retryResponse = await client.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
          { role: "assistant", content: firstContent },
          { role: "user", content: retryMessage },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const retryContent = retryResponse.choices[0]?.message?.content;
      if (retryContent) {
        try {
          const retryParsed = extractJson(retryContent);
          const retryResult = validateDescriptor(retryParsed);
          if (retryResult.success && retryResult.data) {
            return NextResponse.json({
              descriptor: retryResult.data,
              raw: retryContent,
              retried: true,
            });
          }

          return NextResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: `LLM output failed validation after retry: ${retryResult.error}`,
                details: { raw: retryContent },
              },
            },
            { status: 422 }
          );
        } catch (e) {
          return NextResponse.json(
            {
              error: {
                code: "PARSE_ERROR",
                message: `Failed to parse retry response as JSON: ${e instanceof Error ? e.message : "Unknown"}`,
                details: { raw: retryContent },
              },
            },
            { status: 422 }
          );
        }
      }
    }

    // First parse failed entirely, try retry
    const retryMessage = buildRetryPrompt(
      query,
      "Your response was not valid JSON. Output ONLY a JSON object."
    );

    const retryResponse = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
        { role: "assistant", content: firstContent },
        { role: "user", content: retryMessage },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    });

    const retryContent = retryResponse.choices[0]?.message?.content;
    if (retryContent) {
      try {
        const retryParsed = extractJson(retryContent);
        const retryResult = validateDescriptor(retryParsed);
        if (retryResult.success && retryResult.data) {
          return NextResponse.json({
            descriptor: retryResult.data,
            raw: retryContent,
            retried: true,
          });
        }
      } catch {
        // Fall through to error
      }
    }

    return NextResponse.json(
      {
        error: {
          code: "GENERATION_FAILED",
          message: "Failed to generate a valid dashboard descriptor after 2 attempts",
          details: { raw: firstContent },
        },
      },
      { status: 422 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Dashboard generation error:", e);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: `Failed to generate dashboard: ${message}`,
        },
      },
      { status: 500 }
    );
  }
}
