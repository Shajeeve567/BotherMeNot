import { eq, and, inArray } from "drizzle-orm";
import { db } from "../client.js";
import { sourceConnections, type SourceConnectionRow } from "../schema.js";

export interface CreateSourceConnectionInput {
  projectId: string;
  sourceType: string;
  externalId: string; // installation id
  repoId: string;
  repoFullName: string;
}

export type CreateSourceConnectionResult =
  | { status: "saved"; connection: SourceConnectionRow }
  | { status: "repo_taken" }; // already feeds a different project

export const sourceConnectionsRepo = {
  /**
   * Links a repo to a project. A repo can feed only one project: the unique key
   * (source, installation, repo) makes the insert race-safe, so two requests can't both win.
   * Re-linking to the same project is idempotent.
   */
  async create(input: CreateSourceConnectionInput): Promise<CreateSourceConnectionResult> {
    const [inserted] = await db
      .insert(sourceConnections)
      .values(input)
      .onConflictDoNothing()
      .returning();
    if (inserted) return { status: "saved", connection: inserted };

    const existing = await this.findByRepo(input.sourceType, input.externalId, input.repoId);
    if (existing && existing.projectId === input.projectId) {
      return { status: "saved", connection: existing };
    }
    return { status: "repo_taken" };
  },

  /** What the webhook calls: which project (if any) owns this repo? */
  async findByRepo(
    sourceType: string,
    externalId: string,
    repoId: string
  ): Promise<SourceConnectionRow | undefined> {
    const [row] = await db
      .select()
      .from(sourceConnections)
      .where(
        and(
          eq(sourceConnections.sourceType, sourceType),
          eq(sourceConnections.externalId, externalId),
          eq(sourceConnections.repoId, repoId)
        )
      )
      .limit(1);
    return row;
  },

  async findByProjectId(projectId: string): Promise<SourceConnectionRow[]> {
    return db.select().from(sourceConnections).where(eq(sourceConnections.projectId, projectId));
  },

  /** Every repo currently linked under an installation, to mark them in the picker. */
  async listByInstallation(sourceType: string, externalId: string): Promise<SourceConnectionRow[]> {
    return db
      .select()
      .from(sourceConnections)
      .where(
        and(eq(sourceConnections.sourceType, sourceType), eq(sourceConnections.externalId, externalId))
      );
  },

  async delete(id: string): Promise<SourceConnectionRow | undefined> {
    const [row] = await db.delete(sourceConnections).where(eq(sourceConnections.id, id)).returning();
    return row;
  },

  /** Disconnect one connection, scoped to its project so one project can't remove another's. */
  async deleteForProject(id: string, projectId: string): Promise<boolean> {
    const rows = await db
      .delete(sourceConnections)
      .where(and(eq(sourceConnections.id, id), eq(sourceConnections.projectId, projectId)))
      .returning({ id: sourceConnections.id });
    return rows.length > 0;
  },

  /** App uninstalled: every repo under the installation goes. */
  async deleteByInstallation(sourceType: string, externalId: string): Promise<number> {
    const rows = await db
      .delete(sourceConnections)
      .where(
        and(eq(sourceConnections.sourceType, sourceType), eq(sourceConnections.externalId, externalId))
      )
      .returning({ id: sourceConnections.id });
    return rows.length;
  },

  /** Repos removed from the installation on GitHub. */
  async deleteByRepos(sourceType: string, externalId: string, repoIds: string[]): Promise<number> {
    if (repoIds.length === 0) return 0;
    const rows = await db
      .delete(sourceConnections)
      .where(
        and(
          eq(sourceConnections.sourceType, sourceType),
          eq(sourceConnections.externalId, externalId),
          inArray(sourceConnections.repoId, repoIds)
        )
      )
      .returning({ id: sourceConnections.id });
    return rows.length;
  },
};
