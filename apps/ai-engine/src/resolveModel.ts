export interface ModelConfig {
  id: `${string}/${string}`;
  apiKey: string;
}

const DEFAULT_MODEL_ID = "google/gemini-2.5-flash";

export function resolveModel(): ModelConfig {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  return { id: DEFAULT_MODEL_ID, apiKey };
}
