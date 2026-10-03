import type { FastifyInstance } from "fastify";
import { verifyGithubSignature } from "../signals/verify-signature.js";
import { normalizeGithubPayload } from "../signals/normalize-github.js";
import { sourceConnectionsRepo, signalsRepo } from "@bother-me-not/db";
import { config } from "../../config.js";
import { enqueueAiProcessing, enqueueSignalProcessing, routeSignal } from "../signals/enqueue.js";


export async function registerGithubAppWebhookRoute(app: FastifyInstance): Promise<void> {

    app.post("/webhooks/github/app", async (request, reply) => {

        const signatureHeader = request.headers["x-hub-signature-256"];
        const deliveryId = request.headers["x-github-delivery"];
        const githubEvent = request.headers["x-github-event"];

        if (
            typeof signatureHeader !== "string" ||
            typeof deliveryId !== "string" ||
            typeof githubEvent !== "string" ||
            !request.rawBody
        ) {
            return reply.code(400).send({ received: false });
        }

        const validSignature = verifyGithubSignature(
            request.rawBody,
            signatureHeader,
            config.githubApp.webhookSecret
        );
    if (!validSignature) {
      return reply.code(401).send({ received: false });
    }

    const payload = request.body as Record<string, any>;


    if (githubEvent === "installation" && payload.action === "deleted") {
      const connection = await sourceConnectionsRepo.findByExternalId(
        "github",
        String(payload.installation.id)
      );
      if (connection) await sourceConnectionsRepo.delete(connection.id);
      return reply.code(200).send({ received: true });
    }

    if (githubEvent === "installation" || githubEvent === "installation_repositories") {
      return reply.code(200).send({ received: true });
    }

    const connection = await sourceConnectionsRepo.findByExternalId(
      "github",
      String(payload.installation.id)
    );
    if (!connection) {
      return reply.code(200).send({ received: true });
    }

    const normalized = normalizeGithubPayload(githubEvent, deliveryId, payload);
    if (!normalized) {
      return reply.code(200).send({ received: true });
    }

    const { signal, duplicate } = await signalsRepo.insertSignal({
      ...normalized,
      projectId: connection.projectId,
    });

    if (!duplicate) {
      const path = routeSignal(signal.type);
      if (path === "ai") await enqueueAiProcessing(signal.id);
      else await enqueueSignalProcessing(signal.id);
    }

    return reply.code(200).send({ received: true, signalId: signal.id, duplicate });
  });
}
