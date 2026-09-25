import type { FastifyInstance } from "fastify";
import { projectsRepo } from "@bother-me-not/db";
import { createProjectSchema, updateProjectSchema } from "@bother-me-not/contracts";


async function requireOwnedProject(id: string, userId: string){
    const project = await projectsRepo.findById(id);
    if (!project || project.userId !== userId){
        return null;
    }
    return project;
}


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