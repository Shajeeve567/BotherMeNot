import { eq, and } from "drizzle-orm";
import { db } from "../client.js";
import { sourceConnections, type SourceConnectionRow } from "../schema.js";

export interface CreateSourceConnectionInput {
  projectId: string;
  sourceType: string;
  externalId: string;
}

export const sourceConnectionsRepo = {
  async create(input: CreateSourceConnectionInput): Promise<SourceConnectionRow> {
    const [row] = await db.insert(sourceConnections).values(input).returning();
    if (!row) throw new Error("Failed to insert source connection");
    return row;
  },

  async findByExternalId(
    sourceType: string,
    externalId: string
  ): Promise<SourceConnectionRow | undefined> {
    const [row] = await db
      .select()
      .from(sourceConnections)
      .where(
        and(
          eq(sourceConnections.sourceType, sourceType),
          eq(sourceConnections.externalId, externalId)
        )
      )
      .limit(1);
    return row;
  },

  async findByProjectId(projectId: string): Promise<SourceConnectionRow[]> {
    return db.select().from(sourceConnections).where(eq(sourceConnections.projectId, projectId));
  },

  async delete(id: string): Promise<SourceConnectionRow | undefined> {
    const [row] = await db.delete(sourceConnections).where(eq(sourceConnections.id, id)).returning();
    return row;
  },
};