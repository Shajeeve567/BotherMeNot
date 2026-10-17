import type { UpdateProjectBody, UpsertAiConfigBody } from "@bother-me-not/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiConfigApi, type AiConfig } from "./aiConfig";
import { projectsApi, type Project } from "./projects";

/**
 * Hierarchical keys: invalidating ["projects"] also refreshes every project and its
 * AI config, while `exact: true` targets just the list.
 */
export const keys = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
  aiConfig: (id: string) => ["projects", id, "ai-config"] as const,
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

/** Fetches a fresh install link and moves the whole tab to GitHub. */
export function useConnectGithub(id: string) {
  return useMutation({
    mutationFn: () => projectsApi.connectGithub(id),
    onSuccess: ({ installUrl }) => {
      // A fetch() would follow the redirect invisibly; the user has to land on GitHub.
      window.location.href = installUrl;
    },
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
