import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";


export async function registerErrorHandler(app: FastifyInstance): Promise<void> {
    app.setErrorHandler((error, request, reply) => {
        if (error instanceof ZodError){
            return reply.code(400).send({
                error: "Validation failed",
                issues: error.issues.map((issues) => ({
                    path: issues.path.join("."),
                    message: issues.message,
                })),
            });
        }

        request.log.error(error);
        return reply.code(500).send({ error: "Internal server Error" });
    });
}

