import { z } from "zod";

export const signalViewSchema = z.enum(["all", "delivered", "skipped", "failed"]);

export const listSignalsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
  view: signalViewSchema.default("all"),
});

export type ListSignalsQuery = z.infer<typeof listSignalsQuerySchema>;
