// ─── LLM Gateway — Multi-Provider Abstraction ───────────────────────────────
// Unified interface for generating UI specs across GitHub Models, OpenRouter,
// OpenAI, Anthropic, and Ollama. Streaming support via SSE.

import type { LLMPersona } from "@/lib/store/useLLMStore";

export interface LLMRequestOptions {
  prompt: string;
  systemPrompt: string;
  persona: LLMPersona;
  apiKey: string;
  conversationMessages?: { role: string; content: string }[];
  signal?: AbortSignal;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ─── Provider Configurations ─────────────────────────────────────────────────

const PROVIDER_CONFIGS: Record<string, { baseUrl: string; authHeader: string }> = {
  github: {
    baseUrl: "https://models.inference.ai.azure.com",
    authHeader: "Bearer",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    authHeader: "Bearer",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    authHeader: "Bearer",
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    authHeader: "x-api-key",
  },
  ollama: {
    baseUrl: "http://localhost:11434/api",
    authHeader: "",
  },
};

// ─── Generate (Non-Streaming) ────────────────────────────────────────────────

export async function generateCompletion(options: LLMRequestOptions): Promise<LLMResponse> {
  const { prompt, systemPrompt, persona, apiKey, conversationMessages } = options;
  const config = PROVIDER_CONFIGS[persona.provider];
  if (!config) throw new Error(`Unknown provider: ${persona.provider}`);

  if (persona.provider === "anthropic") {
    return generateAnthropic(options, config);
  }

  if (persona.provider === "ollama") {
    return generateOllama(options);
  }

  // OpenAI-compatible API (GitHub, OpenRouter, OpenAI)
  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  if (conversationMessages) messages.push(...conversationMessages);
  messages.push({ role: "user", content: prompt });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (persona.provider === "github") {
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else if (persona.provider === "openrouter") {
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["HTTP-Referer"] = typeof window !== "undefined" ? window.location.origin : "https://genui.dev";
    headers["X-Title"] = "GenUI Studio";
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: persona.model,
      messages,
      temperature: persona.temperature,
      max_tokens: persona.maxTokens,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${persona.provider} API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content || "",
    model: data.model || persona.model,
    provider: persona.provider,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

// ─── Stream (SSE) ────────────────────────────────────────────────────────────

export async function* streamCompletion(
  options: LLMRequestOptions
): AsyncGenerator<string, void, undefined> {
  const { prompt, systemPrompt, persona, apiKey, conversationMessages } = options;
  const config = PROVIDER_CONFIGS[persona.provider];
  if (!config) throw new Error(`Unknown provider: ${persona.provider}`);

  if (persona.provider === "ollama") {
    yield* streamOllama(options);
    return;
  }

  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  if (conversationMessages) messages.push(...conversationMessages);
  messages.push({ role: "user", content: prompt });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (persona.provider === "github") {
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else if (persona.provider === "openrouter") {
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["HTTP-Referer"] = typeof window !== "undefined" ? window.location.origin : "https://genui.dev";
    headers["X-Title"] = "GenUI Studio";
  } else if (persona.provider === "anthropic") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const body: Record<string, unknown> = {
    model: persona.model,
    messages,
    temperature: persona.temperature,
    max_tokens: persona.maxTokens,
    stream: true,
  };

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${persona.provider} API error (${response.status}): ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Ignore parse errors in stream
        }
      }
    }
  }
}

// ─── Provider-Specific Implementations ───────────────────────────────────────

async function generateAnthropic(
  options: LLMRequestOptions,
  config: { baseUrl: string }
): Promise<LLMResponse> {
  const { prompt, systemPrompt, persona, apiKey, conversationMessages } = options;

  const messages: { role: string; content: string }[] = [];
  if (conversationMessages) messages.push(...conversationMessages);
  messages.push({ role: "user", content: prompt });

  const response = await fetch(`${config.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: persona.model,
      system: systemPrompt,
      messages,
      temperature: persona.temperature,
      max_tokens: persona.maxTokens,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return {
    content: data.content?.[0]?.text || "",
    model: data.model,
    provider: "anthropic",
    usage: data.usage
      ? {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        }
      : undefined,
  };
}

async function generateOllama(options: LLMRequestOptions): Promise<LLMResponse> {
  const { prompt, systemPrompt, persona } = options;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: persona.model,
      prompt: `${systemPrompt}\n\n${prompt}`,
      stream: false,
      options: { temperature: persona.temperature },
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Ollama error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return {
    content: data.response || "",
    model: persona.model,
    provider: "ollama",
  };
}

async function* streamOllama(
  options: LLMRequestOptions
): AsyncGenerator<string, void, undefined> {
  const { prompt, systemPrompt, persona } = options;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: persona.model,
      prompt: `${systemPrompt}\n\n${prompt}`,
      stream: true,
      options: { temperature: persona.temperature },
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Ollama error (${response.status}): ${await response.text()}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) yield parsed.response;
      } catch {
        // Ignore
      }
    }
  }
}
