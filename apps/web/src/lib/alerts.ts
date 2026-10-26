import type { EvaluationResult, SignalView } from "@bother-me-not/contracts";
import { api } from "./api";

/** One GitHub event and what the engine decided about it, as `GET /signals` returns it. */
export interface Alert {
  id: string;
  type: string;
  /** received → queued → processed, or failed. */
  status: string;
  receivedAt: string;
  repo: string | null;
  title: string | null;
  author: string | null;
  /** Always https, or null. */
  url: string | null;
  /** Null until the engine has decided (or when the stored decision is unreadable). */
  decision: EvaluationResult | null;
  /** Fixed, user-safe text; only set on failed alerts. */
  error: string | null;
}

export interface AlertsPage {
  signals: Alert[];
  /** Pass back as `cursor` for the next page; null on the last one. */
  nextCursor: string | null;
}

export const alertsApi = {
  list: (projectId: string, opts: { view: SignalView; cursor?: string }, signal?: AbortSignal) => {
    const params = new URLSearchParams({ view: opts.view, limit: "20" });
    if (opts.cursor) params.set("cursor", opts.cursor);
    return api<AlertsPage>(`/api/projects/${encodeURIComponent(projectId)}/signals?${params}`, { signal });
  },
};
