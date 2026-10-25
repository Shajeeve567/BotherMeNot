import type { CreateProjectBody, UpdateProjectBody } from "@bother-me-not/contracts";
import { api } from "./api";

/** A `projects` row as the API returns it. */
export interface Project {
  id: string;
  userId: string;
  name: string;
  aiContext: string | null;
  createdAt: string;
}

/** A repository the GitHub App can access. */
export interface GithubRepo {
  id: string;
  fullName: string;
  private: boolean;
  linkedProjectId: string | null;
}

/** A repository linked to a project (a `source_connections` row). */
export interface RepoConnection {
  id: string;
  projectId: string;
  repoId: string;
  repoFullName: string;
  createdAt: string;
}

const projectPath = (id: string) => `/api/projects/${encodeURIComponent(id)}`;

export const projectsApi = {
  list: (signal?: AbortSignal) => api<Project[]>("/api/projects", { signal }),

  get: (id: string, signal?: AbortSignal) => api<Project>(projectPath(id), { signal }),

  create: (body: CreateProjectBody) => api<Project>("/api/projects", { method: "POST", json: body }),

  /** Send `aiContext: ""` to clear it. */
  update: (id: string, body: UpdateProjectBody) => api<Project>(projectPath(id), { method: "PATCH", json: body }),

  remove: (id: string) => api<void>(projectPath(id), { method: "DELETE" }),

  /**
   * Either `installUrl` (app not installed on their GitHub account yet: navigate there) or
   * `installationId` (already installed: show the repo picker; GitHub would never call back).
   */
  connectGithub: (id: string) =>
    api<{ installUrl: string } | { installationId: string }>(`${projectPath(id)}/connect`, { method: "POST" }),

  /** Repos the installation can see; `linkedProjectId` is set when a project already uses one. */
  githubRepos: async (id: string, installationId: string, signal?: AbortSignal) =>
    (
      await api<{ repos: GithubRepo[] }>(
        `${projectPath(id)}/github/repos?installationId=${encodeURIComponent(installationId)}`,
        { signal },
      )
    ).repos,

  linkRepo: async (id: string, body: { installationId: string; repoId: string }) =>
    (await api<{ connection: RepoConnection }>(`${projectPath(id)}/github/repos`, { method: "POST", json: body }))
      .connection,

  connections: async (id: string, signal?: AbortSignal) =>
    (await api<{ connections: RepoConnection[] }>(`${projectPath(id)}/connections`, { signal })).connections,

  disconnect: (id: string, connectionId: string) =>
    api<void>(`${projectPath(id)}/connections/${encodeURIComponent(connectionId)}`, { method: "DELETE" }),
};
