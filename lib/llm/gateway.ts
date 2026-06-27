import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { ProviderId } from './providers';



export function getClient(provider: ProviderId, apiKey: string) {
  switch (provider) {
    case 'openrouter':
      return createOpenAI({ 
        baseURL: 'https://openrouter.ai/api/v1', 
        apiKey,
        headers: { 'HTTP-Referer': 'https://genui.studio', 'X-Title': 'GenUI Studio' }
      });
    case 'github':
      return createOpenAI({ 
        baseURL: 'https://models.inference.ai.azure.com', 
        apiKey 
      });
    case 'ollama':
      return createOpenAI({ baseURL: 'http://localhost:11434/v1', apiKey: 'ollama' });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function streamGenUI(
  modelId: string, 
  provider: ProviderId, 
  apiKey: string, 
  messages: any,
  systemPrompt: string
) {
  const client = getClient(provider, apiKey);
  const model = client(modelId);
  
  // Vercel AI SDK handles SSE parsing, backpressure, tool calls automatically
  return streamText({
    model,
    messages,
    system: systemPrompt,
    temperature: 0.1, // Deterministic JSON
    maxTokens: 4096,
    // onError, onFinish callbacks for logging/analytics
  });
}
