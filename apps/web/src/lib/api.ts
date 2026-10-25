/** Shape returned by GET /auth/me (a `users` row). */
export interface SessionUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

/** One field-level problem from a 400 "Validation failed" response. */
export interface ApiIssue {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues: ApiIssue[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Field path → first message for it, e.g. { name: "String must contain at least 1 character(s)" }. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const { path, message } of this.issues) out[path] ??= message;
    return out;
  }
}

type ApiOptions = Omit<RequestInit, "body" | "headers"> & {
  headers?: Record<string, string>;
  /** Request body; serialized as JSON with the matching Content-Type. */
  json?: unknown;
};

/**
 * Calls the Fastify API on the same origin. `path` is the backend route itself
 * ("/auth/me", "/api/projects"); Vite proxies those prefixes in dev and a reverse
 * proxy does the same in production, so the httpOnly session cookie just works.
 */
export async function api<T>(path: string, { json, headers, ...init }: ApiOptions = {}): Promise<T> {
  // Only send Content-Type with a body: Fastify rejects an empty body labelled as JSON.
  const hasBody = json !== undefined;

  const res = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(hasBody && { "Content-Type": "application/json" }),
      ...headers,
    },
    body: hasBody ? JSON.stringify(json) : undefined,
  });

  if (!res.ok) {
    // Error bodies may not be JSON (e.g. the proxy's 502 page when the API is down).
    const body = (await res.json().catch(() => null)) as { error?: string; issues?: ApiIssue[] } | null;
    throw new ApiError(res.status, body?.error ?? res.statusText, body?.issues ?? []);
  }

  // 204 No Content (DELETE) has no body to parse.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** User-facing text for any failed request. Branches on status, never on the server's wording. */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return "This no longer exists, or it isn't yours.";
    if (err.status >= 500) return "Something went wrong on our side. Try again in a moment.";
    return err.message;
  }
  return "Couldn't reach the server. Check your connection and try again.";
}

/** Full-page navigation target that starts the GitHub OAuth flow. */
export const GITHUB_LOGIN_URL = "/auth/github";
