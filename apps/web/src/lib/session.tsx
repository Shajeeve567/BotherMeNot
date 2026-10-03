import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, type SessionUser } from "./api";

export type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: SessionUser };

interface SessionContextValue {
  session: SessionState;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    // Aborting on cleanup keeps StrictMode's double-invoke from racing two requests.
    const controller = new AbortController();

    api<SessionUser>("/auth/me", { signal: controller.signal })
      .then((user) => setSession({ status: "authenticated", user }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (!(err instanceof ApiError && err.status === 401)) console.error("Session check failed", err);
        setSession({ status: "anonymous" });
      });

    return () => controller.abort();
  }, []);

  const signOut = useCallback(async () => {
    await api("/auth/logout", { method: "POST" });
    setSession({ status: "anonymous" });
  }, []);

  return <SessionContext.Provider value={{ session, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

/** "Ada Kovač" → "AK"; falls back to the email's first letter. */
export function initialsOf(user: SessionUser): string {
  const source = user.displayName?.trim() || user.email || "?";
  const words = source.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? `${words[0]![0]}${words[words.length - 1]![0]}` : source.slice(0, 2);
  return letters.toUpperCase();
}
