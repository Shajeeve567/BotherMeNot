/** Shape returned by GET /auth/me (a `users` row). */
export interface SessionUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Calls the Fastify API through the same-origin `/api` prefix.
 * Vite proxies it in dev; a reverse proxy does the same in production, so the
 * httpOnly session cookie is sent automatically and no CORS setup is needed.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, body?.error ?? res.statusText);
  }
  return (await res.json()) as T;
}

/** Full-page navigation target that starts the GitHub OAuth flow. */
export const GITHUB_LOGIN_URL = "/api/auth/github";
