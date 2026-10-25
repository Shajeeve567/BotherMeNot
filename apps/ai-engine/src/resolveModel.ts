import type { AiModelConfigWithKey } from "@bother-me-not/db";

export interface ModelConfig {
  id: `${string}/${string}`;
  apiKey: string;
}

const DEFAULT_MODEL_ID = "google/gemini-3.8-flash";

// A project's own config always wins. There is deliberately no fallback to the default
// key when that config later fails: the failure must surface instead of silently
// spending the server's quota.
export function resolveModel(config?: AiModelConfigWithKey): ModelConfig {
  if (config) {
    return { id: `${config.provider}/${config.model}`, apiKey: config.apiKey };
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  return { id: DEFAULT_MODEL_ID, apiKey };
}
