import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().min(1),
    aiContext: z.string().optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    aiContext: z.string().optional(),
});

export type CreateProjectBody = z.infer<typeof createProjectSchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectSchema>;
