import type { FastifyInstance } from "fastify";
import { authIdentitiesRepo, projectsRepo } from "@bother-me-not/db";
import { createProjectSchema, updateProjectSchema } from "@bother-me-not/contracts";
import { config } from "../../config.js";
import { findInstallationForAccount } from "../github-app/client.js";
import { requireOwnedProject } from "./ownership.js";


export async function registerProjectRoutes(app: FastifyInstance): Promise<void> {
    app.post("/api/projects", { preHandler: app.authenticate }, async (request, reply) => {
        // validate incoming input
        const body = createProjectSchema.parse(request.body);

        const project = await projectsRepo.create({
            userId: request.user.userId,
            name: body.name,
            aiContext: body.aiContext
        });

        return reply.code(201).send(project);
    });

    app.post("/api/projects/:id/connect", { preHandler: app.authenticate }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const project = await requireOwnedProject(id, request.user.userId);
        if (!project) return reply.code(404).send({ error: "Not found" });

        // Already installed on their GitHub account: GitHub would only show its settings page and
        // never call our setup URL, so skip it and let the web app show the repo picker.
        const identity = await authIdentitiesRepo.findByUserId(request.user.userId, "github");
        if (!identity) return reply.code(400).send({ error: "No GitHub account linked" });

        const installation = await findInstallationForAccount(identity.providerAccountId);
        if (installation) return { installationId: installation.id };

        // `uid` (not `userId`) so this URL-borne token can never double as a session token
        const state = app.jwt.sign(
            { projectId: id, uid: request.user.userId } as unknown as { userId: string },
            { expiresIn: "10m" }
        );
        const installUrl = `https://github.com/apps/${config.githubApp.slug}/installations/new?state=${state}`;

        return { installUrl };
    });


    app.get("/api/projects", { preHandler: app.authenticate }, async (request) => {
        return projectsRepo.findByUserId(request.user.userId);
    });

    app.get("/api/projects/:id", {preHandler: app.authenticate}, async (request, reply) => {
        const { id } = request.params as { id: string };
        const project = await requireOwnedProject(id, request.user.userId);
        if(!project) return reply.code(404).send({ error: "Not Found" });
        return project;
    });

    app.patch("/api/projects/:id", { preHandler: app.authenticate }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const existing = await requireOwnedProject(id, request.user.userId);
        if (!existing) return reply.code(404).send({ error: "Not found" });

        // validate input
        const body = updateProjectSchema.parse(request.body);
        return projectsRepo.update(id, body);
    });

    app.delete("/api/projects/:id", { preHandler: app.authenticate }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const existing = await requireOwnedProject(id, request.user.userId);
        if (!existing) return reply.code(404).send({ error: "Not found" });

        await projectsRepo.delete(id);
        return reply.code(204).send();
    });

}