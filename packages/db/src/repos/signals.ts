import { eq, and } from "drizzle-orm";
import { db } from "../client.js";
import { signals, type NewSignalRow, type SignalRow } from "../schema.js";

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
};