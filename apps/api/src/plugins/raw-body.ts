import { type FastifyInstance } from "fastify";

declare module "fastify"{
    interface FastifyRequest {
        rawBody?: Buffer;
    }
}

export async function registerRawBody(app: FastifyInstance): Promise<void>{
    app.addContentTypeParser(
        "application/json",
        { parseAs: "buffer"},
        (req, body, done) => {
            req.rawBody = body as Buffer;
            try {
                const json = JSON.parse(body.toString("utf8"));
                done(null, json);
            } catch (err) {
                done(err as Error, undefined);
            }
        }
    )
}