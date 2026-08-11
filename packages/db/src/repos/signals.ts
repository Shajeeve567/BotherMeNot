import { eq, and } from "drizzle-orm";
import { db } from "../client.js";
import { signals, type NewSignalRow, type SignalRow } from "../schema.js";
import { NewSignal } from "@bother-me-not/domain";


export interface InsertSignalResult {
  signal: SignalRow;       // SignalRow comes from ../schema.js
  duplicate: boolean;
}

export const signalsRepo = {
  async create(signal: NewSignalRow): Promise<SignalRow> {
    const [row] = await db.insert(signals).values(signal).returning();
    if (!row) throw new Error("Failed to insert signal");
    return row;
  },

  async findBySourceAndExternalId(
    source: string,
    externalId: string,
  ): Promise<SignalRow | undefined> {
    const [row] = await db
      .select()
      .from(signals)
      .where(
        and(eq(signals.source, source), eq(signals.externalId, externalId)),
      );
    return row;
  },

  async insertSignal(payload: NewSignal): Promise<InsertSignalResult> {
    const existing = await this.findBySourceAndExternalId(payload.source, payload.externalId);
    if(existing) return { signal: existing, duplicate: true }
    const [inserted] = await db.insert(signals).values({
      source: payload.source,
      externalId: payload.externalId,
      type: payload.type,
      payload: payload.payload,
      rawPayload: payload.rawPayload
    })
    .onConflictDoNothing({ target: [signals.source, signals.externalId] })
    .returning();

    if (!inserted) {
      const winner = await this.findBySourceAndExternalId(payload.source, payload.externalId);
      if (winner) return { signal: winner, duplicate: true };
      throw new Error("Conflict resolved but no row found");
    }
    return { signal: inserted, duplicate: false };

  },
};