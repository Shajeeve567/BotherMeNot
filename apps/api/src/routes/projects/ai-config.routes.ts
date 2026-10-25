import type { FastifyInstance } from "fastify";
import { aiModelConfigsRepo } from "@bother-me-not/db";
import { upsertAiConfigSchema } from "@bother-me-not/contracts";
import { requireOwnedProject } from "./ownership.js";

export async function registerAiConfigRoutes(app: FastifyInstance): Promise<void> {
    app.get("/api/projects/:id/ai-config", { preHandler: app.authenticate }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const project = await requireOwnedProject(id, request.user.userId);
        if (!project) return reply.code(404).send({ error: "Not found" });

        const config = await aiModelConfigsRepo.findPublicByProjectId(id);
        return { config: config ?? null };
    });

    app.put("/api/projects/:id/ai-config", { preHandler: app.authenticate }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const project = await requireOwnedProject(id, request.user.userId);
        if (!project) return reply.code(404).send({ error: "Not found" });

        const body = upsertAiConfigSchema.parse(request.body);
        const result = await aiModelConfigsRepo.upsert(id, body);

        if (result.status === "key_required") {
            return reply.code(400).send({ error: "An API key is required the first time a model is configured" });
        }
        if (result.status === "provider_change_needs_key") {
            return reply.code(400).send({ error: "Changing provider requires a new API key" });
        }
        return { config: result.config };
    });

    app.delete("/api/projects/:id/ai-config", { preHandler: app.authenticate }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const project = await requireOwnedProject(id, request.user.userId);
        if (!project) return reply.code(404).send({ error: "Not found" });

        await aiModelConfigsRepo.deleteByProjectId(id);
        return reply.code(204).send();
    });
}
