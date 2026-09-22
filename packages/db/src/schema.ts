import { pgTable, uuid, text, jsonb, timestamp, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

export const authIdentities = pgTable(
  "auth_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // "github", future: "google", "email"
    providerAccountId: text("provider_account_id").notNull(), // GitHub user id, Google sub, etc.
    accessToken: text("access_token"), // nullable — not every provider needs one stored
    refreshToken: text("refresh_token"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // a composite constraint ensuring (provider + providerAccountId) always be unique
  (table) => ({
    providerAccountUnique: unique("auth_identities_provider_account_unique").on(
      table.provider,
      table.providerAccountId
    ),
  })
);

export type AuthIdentityRow = typeof authIdentities.$inferSelect;
export type NewAuthIdentityRow = typeof authIdentities.$inferInsert;

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  aiContext: text("ai_context"), // free text injected into the agent prompt — not tied to any provider
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;

export const notificationChannels = pgTable("notification_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  channelType: text("channel_type").notNull(), // "slack", future: "discord", "email", "pagerduty"
  config: jsonb("config").notNull(), // e.g. { channel: "#alerts", token: "..." } for slack
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NotificationChannelRow = typeof notificationChannels.$inferSelect;
export type NewNotificationChannelRow = typeof notificationChannels.$inferInsert;

export const signals = pgTable(
  "signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
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
    sourceExternalIdProjectUnique: unique("signals_source_external_id_project_unique").on(
      table.source,
      table.externalId,
      table.projectId
    ),
  })
);

export type SignalRow = typeof signals.$inferSelect;
export type NewSignalRow = typeof signals.$inferInsert;
