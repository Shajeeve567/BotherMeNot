import { pgTable, uuid, text, jsonb, timestamp, unique } from "drizzle-orm/pg-core";

export const signals = pgTable(
  "signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").notNull(),
    externalId: text("external_id").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    rawPayload: jsonb("raw_payload").notNull(),
    status: text("status").notNull().default("received"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    formatted: jsonb("formatted"),
  },
  (table) => ({
    sourceExternalIdUnique: unique("signals_source_external_id_unique").on(
      table.source,
      table.externalId
    ),
  })
);

export type SignalRow = typeof signals.$inferSelect;
export type NewSignalRow = typeof signals.$inferInsert;
