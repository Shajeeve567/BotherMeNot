import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import {config} from "../config.js";

export async function registerAuth(app: FastifyInstance): Promise<void> {

    await app.register(cookie);
    await app.register(jwt, {
        secret: config.jwtSecret,
        cookie: {
            cookieName: "session",
            signed: false
        },
    });

    app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
        try{
            await request.jwtVerify({ onlyCookie: true });
        } catch {
            reply.code(401).send({ error: "Unauthorized" });
        }
    });
}
