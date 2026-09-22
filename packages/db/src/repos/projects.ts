import { eq } from "drizzle-orm";
import { db } from "../client.js";
import { projects, type NewProjectRow, type ProjectRow } from "../schema.js";

export interface CreateProjectInput {
  userId: string;
  name: string;
  aiContext?: string;
}

export interface UpdateProjectInput {
  name?: string;
  aiContext?: string;
}

export const projectsRepo = {
  async create(input: CreateProjectInput): Promise<ProjectRow> {
    const [row] = await db
      .insert(projects)
      .values({
        userId: input.userId,
        name: input.name,
        aiContext: input.aiContext,
      } satisfies NewProjectRow)
      .returning();

    if (!row) throw new Error("Failed to insert project");
    return row;
  },

  async findById(id: string): Promise<ProjectRow | undefined> {
    const [row] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    return row;
  },

  async findByUserId(userId: string): Promise<ProjectRow[]> {
    return db.select().from(projects).where(eq(projects.userId, userId));
  },

  async update(id: string, updates: UpdateProjectInput): Promise<ProjectRow | undefined> {
    const [row] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();

    return row;
  },

  async delete(id: string): Promise<ProjectRow | undefined> {
    const [row] = await db.delete(projects).where(eq(projects.id, id)).returning();

    return row;
  },
};
