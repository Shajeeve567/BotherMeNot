import type { AiProvider, UpsertAiConfigBody } from "@bother-me-not/contracts";
import { api } from "./api";

/** A project's own model. The API key itself is write-only and never returned. */
export interface AiConfig {
  provider: AiProvider;
  model: string;
  /** Last 4 characters of the stored key. */
  keyHint: string;
  updatedAt: string;
}

export const PROVIDERS: readonly { id: AiProvider; label: string; modelExample: string }[] = [
  { id: "anthropic", label: "Anthropic", modelExample: "claude-sonnet-4-5" },
  { id: "openai", label: "OpenAI", modelExample: "gpt-4o" },
  { id: "google", label: "Google", modelExample: "gemini-2.5-flash" },
];

export const providerLabel = (id: string) => PROVIDERS.find((p) => p.id === id)?.label ?? id;

const configPath = (projectId: string) => `/api/projects/${encodeURIComponent(projectId)}/ai-config`;

export const aiConfigApi = {
  /** `null` means the project uses the server's default model. */
  get: async (projectId: string, signal?: AbortSignal) =>
    (await api<{ config: AiConfig | null }>(configPath(projectId), { signal })).config,

  /** Omit `apiKey` to keep the stored key (only allowed when the provider is unchanged). */
  save: async (projectId: string, body: UpsertAiConfigBody) =>
    (await api<{ config: AiConfig }>(configPath(projectId), { method: "PUT", json: body })).config,

  /** Reverts the project to the default model. */
  remove: (projectId: string) => api<void>(configPath(projectId), { method: "DELETE" }),
};
