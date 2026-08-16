import { FastifyInstance } from "fastify";
import { verifyGithubSignature } from "./verify-signature.js";
import { normalizeGithubPayload } from "./normalize-github.js";
import { signalIntakeResponseSchema } from "@bother-me-not/contracts";
import { signalsRepo } from "@bother-me-not/db";
import { signalQueue, aiQueue } from "@bother-me-not/queue";
import { ProcessSignalJobData } from "@bother-me-not/contracts";


export async function enqueueSignalProcessing(signalId: string): Promise<void> {
  await signalQueue.add(
    "signal-processing",
    { signalId } satisfies ProcessSignalJobData,
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: { age: 24 * 3600},
    }
  );
}


export async function enqueueAiProcessing(signalId: string): Promise<void> {
  await aiQueue.add(
    "ai-engine-processing",
    signalId satisfies string,
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: { age: 24 * 3600},
    }
  );
}



export async function registerSignalRoutes(app: FastifyInstance): Promise<void> {
    app.post("/webhooks/github", async(request, reply) =>{
        // handling the headers
        const signatureHeader = request.headers["x-hub-signature-256"];
        const deliveryId = request.headers["x-github-delivery"];
        const githubEvent = request.headers["x-github-event"];

        if (
            typeof signatureHeader !== "string" ||
            typeof deliveryId !== "string" ||
            typeof githubEvent !== "string"
        ) {
            request.log.warn("Webhook request missing required GitHub headers");
            return reply.code(400).send({ received: false });
        }
        if (!request.rawBody) {
            request.log.error("Missing rawBody — is raw-body.ts registered before this route?");
            return reply.code(500).send({ received: false });
        }
        const secret = process.env.GITHUB_WEBHOOK_SECRET;
        if (!secret) {
            request.log.error("GITHUB_WEBHOOK_SECRET is not configured");
            return reply.code(500).send({ received: false });
        }

        const validSignature = verifyGithubSignature(request.rawBody, signatureHeader, secret);
        if (!validSignature) {
            request.log.warn({ deliveryId }, "Rejected webhook with invalid signature");
            return reply.code(401).send({ received: false });
        }
        // handling the payload
        const payload = request.body as Record<string, unknown>;
        const normalized = normalizeGithubPayload(githubEvent, deliveryId, payload);

        if (!normalized) {
            return reply.code(200).send(
                signalIntakeResponseSchema.parse({ received: true })
            );
        }
        // Signal enqueuing 
        const { signal, duplicate } = await signalsRepo.insertSignal(normalized);

        
        // AI-engine queueing
        if (!duplicate) {
            await enqueueSignalProcessing(signal.id);
            await enqueueAiProcessing(signal.id);
        }

        return reply.code(200).send(
            signalIntakeResponseSchema.parse({
                received: true,
                signalId: signal.id,
                duplicate,
            })
        );
        
    })



}