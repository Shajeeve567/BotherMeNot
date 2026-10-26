import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../client.js";
import { signals, type NewSignalRow, type SignalRow } from "../schema.js";
import type { NewSignal, SignalStatus } from "@bother-me-not/domain";

export interface InsertSignalResult {
  signal: SignalRow;       // SignalRow comes from ../schema.js
  duplicate: boolean;
}

export type SignalView = "all" | "delivered" | "skipped" | "failed";

export interface ListSignalsOptions {
  limit: number;
  /** id of the last signal on the previous page */
  cursor?: string;
  view: SignalView;
}

export const signalsRepo = {
  async create(signal: NewSignalRow): Promise<SignalRow> {
    const [row] = await db.insert(signals).values(signal).returning();
    if (!row) throw new Error("Failed to insert signal");
    return row;
  },

  async findById(id: string) : Promise<SignalRow | undefined>{
    const [receivedSignal] = await db
      .select()
      .from(signals)
      .where(eq(signals.id, id))
      .limit(1);

    return receivedSignal;
  },

  async findBySourceAndExternalId(
    source: string,
    externalId: string,
    projectId: string,
  ): Promise<SignalRow | undefined> {
    const [row] = await db
      .select()
      .from(signals)
      .where(
        and(
          eq(signals.source, source),
          eq(signals.externalId, externalId),
          eq(signals.projectId, projectId),
        ),
      );
    return row;
  },

  async insertSignal(payload: NewSignal): Promise<InsertSignalResult> {
    const existing = await this.findBySourceAndExternalId(
      payload.source,
      payload.externalId,
      payload.projectId,
    );

    if(existing) return { signal: existing, duplicate: true }

    const [inserted] = await db.insert(signals).values({
      projectId: payload.projectId,
      source: payload.source,
      externalId: payload.externalId,
      type: payload.type,
      payload: payload.payload,
      rawPayload: payload.rawPayload
    })
    .onConflictDoNothing({ target: [signals.source, signals.externalId, signals.projectId] })
    .returning();

    if (!inserted) {
      const winner = await this.findBySourceAndExternalId(
        payload.source,
        payload.externalId,
        payload.projectId,
      );
      if (winner) return { signal: winner, duplicate: true };
      throw new Error("Conflict resolved but no row found");
    }
    return { signal: inserted, duplicate: false };

  },
  /**
   * A project's signals, newest first. Keyset pagination: the cursor is the last row's id and
   * Postgres compares (received_at, id) exactly, so new arrivals never shift or repeat pages.
   * Returns one extra row when more exist; the caller uses it to build the next cursor.
   */
  async listByProject(projectId: string, opts: ListSignalsOptions): Promise<SignalRow[]> {
    const filters = [eq(signals.projectId, projectId)];

    if (opts.cursor) {
      filters.push(
        sql`(${signals.receivedAt}, ${signals.id}) < (
          select received_at, id from signals where id = ${opts.cursor} and project_id = ${projectId}
        )`,
      );
    }
    if (opts.view === "failed") {
      filters.push(eq(signals.status, "failed"));
    } else if (opts.view === "delivered") {
      filters.push(eq(signals.status, "processed"), sql`${signals.formatted}->>'deliver' = 'true'`);
    } else if (opts.view === "skipped") {
      filters.push(eq(signals.status, "processed"), sql`${signals.formatted}->>'deliver' = 'false'`);
    }

    return db
      .select()
      .from(signals)
      .where(and(...filters))
      .orderBy(desc(signals.receivedAt), desc(signals.id))
      .limit(opts.limit + 1);
  },

  /** Records why a signal failed. `message` must be fixed, user-safe text. */
  async markFailed(id: string, message: string): Promise<void> {
    await db.update(signals).set({ status: "failed", error: message }).where(eq(signals.id, id));
  },

  async updateStatus(id: string, status: SignalStatus): Promise<SignalRow | undefined> {
  const [row] = await db
      .update(signals)
      // any move away from "failed" (a retry started, or it succeeded) clears the old reason
      .set(status === "failed" ? { status } : { status, error: null })
      .where(eq(signals.id, id))
      .returning();
    return row;
  },

  async updateFormatted(id: string, formatted: unknown): Promise<SignalRow | undefined> {
    const [row] = await db
      .update(signals)
      .set({ formatted })
      .where(eq(signals.id, id))
      .returning();
    return row;
  }
};