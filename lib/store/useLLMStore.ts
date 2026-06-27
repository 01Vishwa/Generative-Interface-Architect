// ─── LLM Store — Personas, Conversations, Streaming ──────────────────────────
// Manages LLM configuration, conversation history, and streaming state.

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// ─── Persona Types ───────────────────────────────────────────────────────────

export interface LLMPersona {
  id: string;
  name: string;
  description: string;
  model: string;
  provider: "github" | "openrouter" | "openai" | "anthropic" | "ollama";
  temperature: number;
  systemPrompt: string;
  maxTokens: number;
  icon: string;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  messages: ConversationMessage[];
  personaId: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Default Personas ────────────────────────────────────────────────────────

export const DEFAULT_PERSONAS: LLMPersona[] = [
  {
    id: "architect",
    name: "GenUI Architect",
    description: "Precise, structured UI specs with optimal component hierarchy",
    model: "gpt-4o-mini",
    provider: "github",
    temperature: 0.0,
    systemPrompt: `You are a Senior Generative UI Engineer. Output ONLY valid JSON patches (RFC 6902) targeting the GenUI IR.
    IR Schema: { "type": "object", "properties": { "id": {"type": "string"}, "type": {"type": "string"}, "props": {"type": "object"}, "children": {"type": "array"} } }
    Rules: 1. Never output full spec. 2. Use 'add' for new nodes, 'replace' for props, 'move' for reorder. 3. Reference nodes by 'id'. 4. Use components from CATALOG only.`,
    maxTokens: 4096,
    icon: "🏗️",
  },
  {
    id: "explorer",
    name: "Creative Explorer",
    description: "Experimental, creative UI designs with rich interactions",
    model: "meta-llama/llama-3.1-8b-instruct:free",
    provider: "openrouter",
    temperature: 0.7,
    systemPrompt: `You are a creative UI designer. Generate complete, valid GenUI IR specifications from scratch.
    Focus on visual hierarchy, modern patterns, and component composition. Output full JSON spec.`,
    maxTokens: 4096,
    icon: "🎨",
  },
  {
    id: "local",
    name: "Local Privacy (Ollama)",
    description: "Uses local Ollama models — no data leaves your machine",
    model: "llama3.2",
    provider: "ollama",
    temperature: 0.2,
    systemPrompt: "...",
    maxTokens: 2048,
    icon: "🔒",
  }
];

// ─── Store ───────────────────────────────────────────────────────────────────

export interface LLMState {
  // ─── Configuration ──────────────────────────────────────────────────────
  activePersonaId: string;
  personas: LLMPersona[];
  /** API keys per provider */
  apiKeys: Record<string, string>;

  // ─── Streaming State ────────────────────────────────────────────────────
  isGenerating: boolean;
  generationError: string | null;
  streamingContent: string;
  streamProgress: number; // 0-1

  // ─── Conversations ──────────────────────────────────────────────────────
  conversations: Conversation[];
  activeConversationId: string | null;

  // ─── Actions ────────────────────────────────────────────────────────────
  setActivePersona: (personaId: string) => void;
  addCustomPersona: (persona: LLMPersona) => void;
  removePersona: (personaId: string) => void;
  setApiKey: (provider: string, key: string) => void;
  getApiKey: (provider: string) => string;

  setIsGenerating: (v: boolean) => void;
  setGenerationError: (err: string | null) => void;
  setStreamingContent: (content: string) => void;
  setStreamProgress: (progress: number) => void;

  startConversation: (workspaceId: string) => string;
  addMessage: (conversationId: string, message: ConversationMessage) => void;
  setActiveConversation: (id: string | null) => void;
  clearConversation: (id: string) => void;

  getActivePersona: () => LLMPersona;
}

export const useLLMStore = create<LLMState>()(
  devtools(
    persist(
      (set, get) => ({
        activePersonaId: "architect",
        personas: DEFAULT_PERSONAS,
        apiKeys: {},

        isGenerating: false,
        generationError: null,
        streamingContent: "",
        streamProgress: 0,

        conversations: [],
        activeConversationId: null,

        // ─── Actions ───────────────────────────────────────────────────────

        setActivePersona: (personaId) => set({ activePersonaId: personaId }),

        addCustomPersona: (persona) =>
          set((state) => ({ personas: [...state.personas, persona] })),

        removePersona: (personaId) =>
          set((state) => ({
            personas: state.personas.filter((p) => p.id !== personaId),
            activePersonaId:
              state.activePersonaId === personaId
                ? "architect"
                : state.activePersonaId,
          })),

        setApiKey: (provider, key) =>
          set((state) => ({
            apiKeys: { ...state.apiKeys, [provider]: key },
          })),

        getApiKey: (provider) => {
          return get().apiKeys[provider] || "";
        },

        setIsGenerating: (v) => set({ isGenerating: v }),
        setGenerationError: (err) => set({ generationError: err }),
        setStreamingContent: (content) => set({ streamingContent: content }),
        setStreamProgress: (progress) => set({ streamProgress: progress }),

        startConversation: (workspaceId) => {
          const id = `conv-${Date.now().toString(36)}`;
          const conv: Conversation = {
            id,
            workspaceId,
            messages: [],
            personaId: get().activePersonaId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          set((state) => ({
            conversations: [...state.conversations, conv],
            activeConversationId: id,
          }));
          return id;
        },

        addMessage: (conversationId, message) =>
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversationId
                ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
                : c
            ),
          })),

        setActiveConversation: (id) => set({ activeConversationId: id }),

        clearConversation: (id) =>
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === id ? { ...c, messages: [], updatedAt: Date.now() } : c
            ),
          })),

        getActivePersona: () => {
          const { activePersonaId, personas } = get();
          return personas.find((p) => p.id === activePersonaId) || DEFAULT_PERSONAS[0];
        },
      }),
      {
        name: "genui-llm-store",
        partializer: (state) => ({
          activePersonaId: state.activePersonaId,
          apiKeys: state.apiKeys,
          personas: state.personas.filter((p) => !DEFAULT_PERSONAS.find((d) => d.id === p.id)),
          conversations: state.conversations.slice(-20), // Keep last 20
        }),
      }
    ),
    { name: "LLMStore" }
  )
);
