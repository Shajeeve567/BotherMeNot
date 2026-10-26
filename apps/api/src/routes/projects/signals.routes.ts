import type { FastifyInstance } from "fastify";
import { signalsRepo, type SignalRow } from "@bother-me-not/db";
import { evaluationResultSchema, listSignalsQuerySchema } from "@bother-me-not/contracts";
import { requireOwnedProject } from "./ownership.js";

/** What the Alerts tab needs. rawPayload and the issue body stay on the server. */
function toAlert(row: SignalRow) {
  const p = (row.payload ?? {}) as Record<string, unknown>;
  // formatted is written by the engine; if it ever doesn't match, show no decision rather than guess
  const decision = evaluationResultSchema.safeParse(row.formatted);

  return {
    id: row.id,
    type: row.type,
    status: row.status,
    receivedAt: row.receivedAt,
    repo: typeof p.repo === "string" ? p.repo : null,
    title: typeof p.title === "string" ? p.title : null,
    author: typeof p.author === "string" ? p.author : null,
    url: typeof p.url === "string" && p.url.startsWith("https://") ? p.url : null,
    decision: decision.success ? decision.data : null,
    error: row.error,
  };
}

export async function registerSignalRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/projects/:id/signals", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await requireOwnedProject(id, request.user.userId);
    if (!project) return reply.code(404).send({ error: "Not found" });

    const { limit, cursor, view } = listSignalsQuerySchema.parse(request.query);
    const rows = await signalsRepo.listByProject(id, { limit, cursor, view });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      signals: page.map(toAlert),
      nextCursor: hasMore ? page[page.length - 1]!.id : null,
    };
  });
}
