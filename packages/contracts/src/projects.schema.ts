import { z } from "zod";

const aiContextSchema = z.string().max(2000);

export const createProjectSchema = z.object({
    name: z.string().min(1).max(100),
    aiContext: aiContextSchema.optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    aiContext: aiContextSchema.optional(),
});

export type CreateProjectBody = z.infer<typeof createProjectSchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectSchema>;
