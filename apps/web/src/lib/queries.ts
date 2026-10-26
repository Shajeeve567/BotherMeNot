import type { SignalView, UpdateProjectBody, UpsertAiConfigBody } from "@bother-me-not/contracts";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiConfigApi, type AiConfig } from "./aiConfig";
import { alertsApi } from "./alerts";
import { projectsApi, type Project, type RepoConnection } from "./projects";

/**
 * Hierarchical keys: invalidating ["projects"] also refreshes every project and its
 * AI config, while `exact: true` targets just the list.
 */
export const keys = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  aiConfig: (id: string) => ["projects", id, "ai-config"] as const,
  connections: (id: string) => ["projects", id, "connections"] as const,
  githubRepos: (id: string, installationId: string) => ["projects", id, "github-repos", installationId] as const,
  alerts: (id: string, view: SignalView) => ["projects", id, "alerts", view] as const,
};

// ── Projects ──────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: keys.projects,
    queryFn: ({ signal }) => projectsApi.list(signal),
  });
}

export function useProject(id: string) {
  const qc = useQueryClient();
  // Explicit type: with a placeholderData function, inference picks the function type instead.
  return useQuery<Project>({
    queryKey: keys.project(id),
    queryFn: ({ signal }) => projectsApi.get(id, signal),
    // Coming from the list, show the row we already have while the fresh copy loads.
    placeholderData: () => qc.getQueryData<Project[]>(keys.projects)?.find((p) => p.id === id),
  });
}

function useStoreProject() {
  const qc = useQueryClient();
  return (project: Project) => {
    qc.setQueryData(keys.project(project.id), project);
    void qc.invalidateQueries({ queryKey: keys.projects, exact: true });
  };
}

export function useCreateProject() {
  const store = useStoreProject();
  return useMutation({ mutationFn: projectsApi.create, onSuccess: store });
}

export function useUpdateProject(id: string) {
  const store = useStoreProject();
  return useMutation({
    mutationFn: (body: UpdateProjectBody) => projectsApi.update(id, body),
    onSuccess: store,
  });
}

export function useDeleteProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => projectsApi.remove(id),
    // Only the list is updated. Removing the project's own entry here would make the page
    // that's still mounted refetch it (and 404) before the caller navigates away; unused
    // entries are garbage-collected anyway.
    onSuccess: () => qc.setQueryData<Project[]>(keys.projects, (list) => list?.filter((p) => p.id !== id)),
  });
}

/**
 * Asks the API how to connect. A fresh install moves the whole tab to GitHub; if the app is
 * already installed there is nowhere to send them, so the caller gets the installation id
 * (via `onInstalled`) and shows the repo picker instead.
 */
export function useConnectGithub(id: string, onInstalled: (installationId: string) => void) {
  return useMutation({
    mutationFn: () => projectsApi.connectGithub(id),
    onSuccess: (result) => {
      if ("installationId" in result) {
        onInstalled(result.installationId);
        return;
      }
      // A fetch() would follow the redirect invisibly; the user has to land on GitHub.
      window.location.href = result.installUrl;
    },
  });
}

export function useConnections(projectId: string) {
  return useQuery({
    queryKey: keys.connections(projectId),
    queryFn: ({ signal }) => projectsApi.connections(projectId, signal),
  });
}

/** Repos the installation can see. Always refetched on open: they change on GitHub's side. */
export function useGithubRepos(projectId: string, installationId: string | null) {
  return useQuery({
    queryKey: keys.githubRepos(projectId, installationId ?? ""),
    queryFn: ({ signal }) => projectsApi.githubRepos(projectId, installationId!, signal),
    enabled: installationId !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

export function useLinkRepo(projectId: string, installationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repoId: string) => projectsApi.linkRepo(projectId, { installationId, repoId }),
    onSuccess: (connection) => {
      qc.setQueryData<RepoConnection[]>(keys.connections(projectId), (list) =>
        list && !list.some((c) => c.id === connection.id) ? [...list, connection] : list,
      );
      void qc.invalidateQueries({ queryKey: keys.githubRepos(projectId, installationId) });
    },
  });
}

export function useDisconnectRepo(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => projectsApi.disconnect(projectId, connectionId),
    onSuccess: (_void, connectionId) =>
      qc.setQueryData<RepoConnection[]>(keys.connections(projectId), (list) =>
        list?.filter((c) => c.id !== connectionId),
      ),
  });
}

// ── Alerts ────────────────────────────────────────────────────────────────

/**
 * A project's alerts, newest first, one page per fetch. Each page hands back the cursor for
 * the next, and every view (all / delivered / ...) is cached separately.
 */
export function useAlerts(projectId: string | null, view: SignalView) {
  return useInfiniteQuery({
    queryKey: keys.alerts(projectId ?? "", view),
    queryFn: ({ pageParam, signal }) => alertsApi.list(projectId!, { view, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: projectId !== null,
    // New events arrive on their own; check again when the user comes back to the tab.
    staleTime: 15_000,
  });
}

// ── AI model ──────────────────────────────────────────────────────────────

export function useAiConfig(projectId: string) {
  return useQuery({
    queryKey: keys.aiConfig(projectId),
    queryFn: ({ signal }) => aiConfigApi.get(projectId, signal),
  });
}

export function useSaveAiConfig(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertAiConfigBody) => aiConfigApi.save(projectId, body),
    onSuccess: (config) => qc.setQueryData<AiConfig | null>(keys.aiConfig(projectId), config),
  });
}

export function useRemoveAiConfig(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiConfigApi.remove(projectId),
    onSuccess: () => qc.setQueryData<AiConfig | null>(keys.aiConfig(projectId), null),
  });
}
