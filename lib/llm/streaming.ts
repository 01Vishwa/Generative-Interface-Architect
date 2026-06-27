// ─── LLM Streaming — Patch-Based Incremental Parser ──────────────────────────
// Parses streaming LLM output and applies incremental updates to the spec.
// Handles both full-spec generation and JSON-patch-based streaming.

export interface StreamingState {
  accumulated: string;
  isComplete: boolean;
  lastValidJson: unknown | null;
  parseAttempts: number;
}

/**
 * Create a new streaming state.
 */
export function createStreamingState(): StreamingState {
  return {
    accumulated: "",
    isComplete: false,
    lastValidJson: null,
    parseAttempts: 0,
  };
}

/**
 * Process a streaming chunk and try to extract valid JSON.
 * Returns the current state and whether new valid JSON was found.
 */
export function processStreamChunk(
  state: StreamingState,
  chunk: string
): { state: StreamingState; newValidJson: unknown | null } {
  const accumulated = state.accumulated + chunk;
  let newValidJson: unknown | null = null;

  // Try to parse the accumulated content as JSON
  const cleaned = cleanJsonString(accumulated);

  try {
    const parsed = JSON.parse(cleaned);
    newValidJson = parsed;
    return {
      state: {
        accumulated,
        isComplete: false,
        lastValidJson: parsed,
        parseAttempts: 0,
      },
      newValidJson,
    };
  } catch {
    // Try to extract partial JSON (everything up to the last valid closing brace)
    const partialJson = extractPartialJson(cleaned);
    if (partialJson) {
      try {
        const parsed = JSON.parse(partialJson);
        newValidJson = parsed;
        return {
          state: {
            accumulated,
            isComplete: false,
            lastValidJson: parsed,
            parseAttempts: state.parseAttempts + 1,
          },
          newValidJson,
        };
      } catch {
        // Still not valid
      }
    }
  }

  return {
    state: {
      ...state,
      accumulated,
      parseAttempts: state.parseAttempts + 1,
    },
    newValidJson: null,
  };
}

/**
 * Finalize the stream — try one last parse of the full accumulated content.
 */
export function finalizeStream(state: StreamingState): {
  finalJson: unknown | null;
  error: string | null;
} {
  const cleaned = cleanJsonString(state.accumulated);

  try {
    const parsed = JSON.parse(cleaned);
    return { finalJson: parsed, error: null };
  } catch (e) {
    // Try to salvage what we can
    const partial = extractPartialJson(cleaned);
    if (partial) {
      try {
        const parsed = JSON.parse(partial);
        return { finalJson: parsed, error: "Partial parse — some content may be missing" };
      } catch {
        // Give up
      }
    }

    return {
      finalJson: state.lastValidJson,
      error: state.lastValidJson
        ? "Stream ended with incomplete JSON — using last valid state"
        : `Failed to parse generated content: ${(e as Error).message}`,
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Clean a JSON string by removing markdown code fences and leading/trailing whitespace.
 */
function cleanJsonString(str: string): string {
  return str
    .replace(/^```(?:json)?\s*/gm, "")
    .replace(/\s*```\s*$/gm, "")
    .trim();
}

/**
 * Try to extract valid JSON from a partial string.
 * Finds matching braces/brackets and returns the longest valid substring.
 */
function extractPartialJson(str: string): string | null {
  // Find the first { or [
  const firstBrace = str.indexOf("{");
  const firstBracket = str.indexOf("[");

  let start: number;
  let openChar: string;
  let closeChar: string;

  if (firstBrace === -1 && firstBracket === -1) return null;
  if (firstBrace === -1) {
    start = firstBracket;
    openChar = "[";
    closeChar = "]";
  } else if (firstBracket === -1) {
    start = firstBrace;
    openChar = "{";
    closeChar = "}";
  } else if (firstBracket < firstBrace) {
    start = firstBracket;
    openChar = "[";
    closeChar = "]";
  } else {
    start = firstBrace;
    openChar = "{";
    closeChar = "}";
  }

  // Find the last matching close
  let depth = 0;
  let lastValidEnd = -1;
  let inString = false;
  let escape = false;

  for (let i = start; i < str.length; i++) {
    const ch = str[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\") {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === openChar) depth++;
    if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        lastValidEnd = i;
      }
    }
  }

  if (lastValidEnd !== -1) {
    return str.slice(start, lastValidEnd + 1);
  }

  // Try to close the JSON manually
  if (depth > 0) {
    let closers = "";
    // We need to close from innermost to outermost
    // This is a best-effort approach
    for (let d = 0; d < depth; d++) {
      closers += closeChar;
    }
    const attempt = str.slice(start) + closers;
    try {
      JSON.parse(attempt);
      return attempt;
    } catch {
      return null;
    }
  }

  return null;
}
