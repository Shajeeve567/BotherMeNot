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

const projectPath = (id: string) => `/api/projects/${encodeURIComponent(id)}`;

export const projectsApi = {
  list: (signal?: AbortSignal) => api<Project[]>("/api/projects", { signal }),

  get: (id: string, signal?: AbortSignal) => api<Project>(projectPath(id), { signal }),

  create: (body: CreateProjectBody) => api<Project>("/api/projects", { method: "POST", json: body }),

  /** Send `aiContext: ""` to clear it. */
  update: (id: string, body: UpdateProjectBody) => api<Project>(projectPath(id), { method: "PATCH", json: body }),

  remove: (id: string) => api<void>(projectPath(id), { method: "DELETE" }),

  /** Returns a GitHub App install link, valid for 10 minutes. Navigate to it; don't fetch it. */
  connectGithub: (id: string) => api<{ installUrl: string }>(`${projectPath(id)}/connect`, { method: "POST" }),
};
