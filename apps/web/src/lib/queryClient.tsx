import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ApiError } from "./api";
import { useSession } from "./session";

const isUnauthorized = (err: unknown) => err instanceof ApiError && err.status === 401;

/**
 * One cache per signed-in session. Lives inside <SessionProvider> so any 401, from a
 * query or a mutation, ends the session in one place instead of in every screen.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const { session, expire } = useSession();

  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: (err) => isUnauthorized(err) && expire() }),
        mutationCache: new MutationCache({ onError: (err) => isUnauthorized(err) && expire() }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // 4xx answers won't change on retry; only retry network errors and 5xx.
            retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
          },
        },
      }),
  );

  // Never show one user's cached projects to the next person on this browser.
  useEffect(() => {
    if (session.status === "anonymous") client.clear();
  }, [session.status, client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
