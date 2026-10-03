import type { FastifyRequest, FastifyReply } from "fastify";

// overiding default types with specific types to the app
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string };
    user: { userId: string };
  }
}

// add an utility function: authenicate
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}