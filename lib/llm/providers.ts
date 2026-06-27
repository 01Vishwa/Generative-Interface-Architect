// lib/llm/providers.ts
export type ProviderId = 'openrouter' | 'github' | 'ollama' | 'custom';

export interface ModelConfig {
  id: string;                 // e.g., 'meta-llama/llama-3.1-8b-instruct:free'
  name: string;               // 'Llama 3.1 8B (Free)'
  provider: ProviderId;
  contextWindow: number;      // 131072
  supportsTools: boolean;     // false for most free models
  pricing: { input: number; output: number }; // $0
}

export const FREE_MODELS: ModelConfig[] = [
  // OpenRouter Free Tier (Requires OPENROUTER_API_KEY)
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', provider: 'openrouter', contextWindow: 131072, supportsTools: false, pricing: { input: 0, output: 0 } },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', provider: 'openrouter', contextWindow: 8192, supportsTools: false, pricing: { input: 0, output: 0 } },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini 128k', provider: 'openrouter', contextWindow: 128000, supportsTools: false, pricing: { input: 0, output: 0 } },
  
  // GitHub Models (Requires GITHUB_TOKEN w/ models scope)
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'github', contextWindow: 128000, supportsTools: true, pricing: { input: 0, output: 0 } },
  { id: 'Phi-3-mini-4k-instruct', name: 'Phi-3 Mini (GH)', provider: 'github', contextWindow: 4096, supportsTools: false, pricing: { input: 0, output: 0 } },
];
