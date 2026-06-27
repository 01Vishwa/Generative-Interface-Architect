/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// ─── useLLMStream — SSE + Patch Application ─────────────────────────────────
// Hook for streaming LLM generation with progressive rendering.

import { useCallback, useRef } from "react";
import { useSpecStore } from "@/lib/store/useSpecStore";
import { useLLMStore } from "@/lib/store/useLLMStore";
import { streamCompletion, generateCompletion } from "@/lib/llm/gateway";
import { buildSystemPrompt } from "@/lib/llm/personas";
import {
  createStreamingState,
  processStreamChunk,
  finalizeStream,
} from "@/lib/llm/streaming";

export function useLLMStream() {
  const abortRef = useRef<AbortController | null>(null);

  const format = useSpecStore((s) => s.format);
  const catalog = useSpecStore((s) => s.catalog);
  const rawText = useSpecStore((s) => s.rawText);
  const setRawText = useSpecStore((s) => s.setRawText);
  const setParsedSpec = useSpecStore((s) => s.setParsedSpec);
  const initFromText = useSpecStore((s) => s.initFromText);

  const getActivePersona = useLLMStore((s) => s.getActivePersona);
  const getApiKey = useLLMStore((s) => s.getApiKey);
  const isGenerating = useLLMStore((s) => s.isGenerating);
  const setIsGenerating = useLLMStore((s) => s.setIsGenerating);
  const setGenerationError = useLLMStore((s) => s.setGenerationError);
  const setStreamingContent = useLLMStore((s) => s.setStreamingContent);
  const setStreamProgress = useLLMStore((s) => s.setStreamProgress);
  const addMessage = useLLMStore((s) => s.addMessage);
  const startConversation = useLLMStore((s) => s.startConversation);
  const activeConversationId = useLLMStore((s) => s.activeConversationId);
  const conversations = useLLMStore((s) => s.conversations);

  const generate = useCallback(
    async (prompt: string, useStreaming = true) => {
      if (!prompt.trim() || isGenerating) return;

      const persona = getActivePersona();
      const apiKey = getApiKey(persona.provider) || getApiKey("github") || "";

      if (!apiKey && persona.provider !== "ollama") {
        setGenerationError("No API key configured. Please set one in Settings.");
        return;
      }

      setIsGenerating(true);
      setGenerationError(null);
      setStreamingContent("");
      setStreamProgress(0);

      abortRef.current = new AbortController();

      // Ensure conversation exists
      let convId = activeConversationId;
      if (!convId) {
        convId = startConversation("default");
      }

      // Add user message
      addMessage(convId, {
        role: "user",
        content: prompt,
        timestamp: Date.now(),
      });

      // Get conversation context
      const conv = conversations.find((c) => c.id === convId);
      const contextMessages = conv?.messages
        .slice(-10) // Last 10 messages for context
        .map((m) => ({ role: m.role, content: m.content })) || [];

      const systemPrompt = buildSystemPrompt(catalog, format);

      try {
        if (useStreaming && persona.provider !== "ollama") {
          // Streaming mode
          let streamState = createStreamingState();

          const stream = streamCompletion({
            prompt,
            systemPrompt,
            persona,
            apiKey,
            conversationMessages: contextMessages,
            signal: abortRef.current.signal,
          });

          for await (const chunk of stream) {
            const result = processStreamChunk(streamState, chunk);
            streamState = result.state;

            // Update editor in real-time
            setStreamingContent(streamState.accumulated);
            setRawText(streamState.accumulated);

            // Try to update canvas with partial JSON
            if (result.newValidJson) {
              setParsedSpec(result.newValidJson);
              setStreamProgress(0.5); // Rough estimate
            }
          }

          // Finalize
          const { finalJson, error } = finalizeStream(streamState);
          if (finalJson) {
            const formattedText = JSON.stringify(finalJson, null, 2);
            initFromText(formattedText, format);
            setStreamProgress(1);
          }
          if (error) {
            setGenerationError(error);
          }

          // Add assistant message
          addMessage(convId, {
            role: "assistant",
            content: streamState.accumulated,
            timestamp: Date.now(),
          });
        } else {
          // Non-streaming mode
          const result = await generateCompletion({
            prompt,
            systemPrompt,
            persona,
            apiKey,
            conversationMessages: contextMessages,
            signal: abortRef.current.signal,
          });

          // Clean and parse
          const cleaned = result.content
            .replace(/^```(?:json)?\s*/gm, "")
            .replace(/\s*```\s*$/gm, "")
            .trim();

          try {
            const parsed = JSON.parse(cleaned);
            const formattedText = JSON.stringify(parsed, null, 2);
            initFromText(formattedText, format);
            setStreamProgress(1);
          } catch {
            setRawText(cleaned);
            setGenerationError("Generated content is not valid JSON");
          }

          addMessage(convId, {
            role: "assistant",
            content: result.content,
            timestamp: Date.now(),
          });
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          setGenerationError(error.message);
          console.error("Generation error:", error);
        }
      } finally {
        setIsGenerating(false);
        setStreamProgress(0);
      }
    },
    [
      format, catalog, isGenerating, getActivePersona, getApiKey,
      setRawText, setParsedSpec, initFromText,
      setIsGenerating, setGenerationError, setStreamingContent, setStreamProgress,
      addMessage, startConversation, activeConversationId, conversations,
    ]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsGenerating(false);
  }, [setIsGenerating]);

  return {
    generate,
    abort,
    isGenerating,
  };
}
