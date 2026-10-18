import type { FastifyInstance } from "fastify";
import { sourceConnectionsRepo } from "@bother-me-not/db";
import { connectRepoSchema, listReposQuerySchema } from "@bother-me-not/contracts";
import { listInstallationRepos } from "../github-app/client.js";
import { userOwnsInstallation } from "../github-app/ownership.js";
import { requireOwnedProject } from "./ownership.js";

export async function registerConnectionRoutes(app: FastifyInstance): Promise<void> {
  // Repos the user's installation can see, each marked with the project (if any) it already feeds.
  app.get("/api/projects/:id/github/repos", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await requireOwnedProject(id, request.user.userId);
    if (!project) return reply.code(404).send({ error: "Not found" });

    const { installationId } = listReposQuerySchema.parse(request.query);
    if (!(await userOwnsInstallation(request.user.userId, installationId))) {
      return reply.code(404).send({ error: "Not found" });
    }

    const repos = await listInstallationRepos(installationId);
    if (!repos) return reply.code(404).send({ error: "Not found" });

    const linked = await sourceConnectionsRepo.listByInstallation("github", installationId);
    const projectByRepo = new Map(linked.map((c) => [c.repoId, c.projectId]));

    return {
      repos: repos.map((r) => ({
        ...r,
        linkedProjectId: projectByRepo.get(r.id) ?? null,
      })),
    };
  });

  // Links one repo to this project. The repo name comes from GitHub, never from the client.
  app.post("/api/projects/:id/github/repos", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await requireOwnedProject(id, request.user.userId);
    if (!project) return reply.code(404).send({ error: "Not found" });

    const { installationId, repoId } = connectRepoSchema.parse(request.body);
    if (!(await userOwnsInstallation(request.user.userId, installationId))) {
      return reply.code(404).send({ error: "Not found" });
    }

    const repos = await listInstallationRepos(installationId);
    const repo = repos?.find((r) => r.id === repoId);
    if (!repo) return reply.code(404).send({ error: "Not found" });

    const result = await sourceConnectionsRepo.create({
      projectId: id,
      sourceType: "github",
      externalId: installationId,
      repoId: repo.id,
      repoFullName: repo.fullName,
    });
    if (result.status === "repo_taken") {
      return reply.code(409).send({ error: "This repository is already connected to another project" });
    }
    return reply.code(201).send({ connection: result.connection });
  });

  app.get("/api/projects/:id/connections", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await requireOwnedProject(id, request.user.userId);
    if (!project) return reply.code(404).send({ error: "Not found" });

    return { connections: await sourceConnectionsRepo.findByProjectId(id) };
  });

  app.delete(
    "/api/projects/:id/connections/:connectionId",
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id, connectionId } = request.params as { id: string; connectionId: string };
      const project = await requireOwnedProject(id, request.user.userId);
      if (!project) return reply.code(404).send({ error: "Not found" });

      const removed = await sourceConnectionsRepo.deleteForProject(connectionId, id);
      if (!removed) return reply.code(404).send({ error: "Not found" });
      return reply.code(204).send();
    }
  );
}
