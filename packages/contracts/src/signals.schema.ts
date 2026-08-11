import { z } from "zod";

export const signalSchema = z.object({
  source: z.literal("github"),
  externalId: z.string().min(1),
  type: z.enum([
    "issue_created",
    "issue_commented",
    "pr_opened",
    "pr_synchronized",
    "ci_run_failed",
    "ci_run_succeeded",
  ]),
  payload: z.object({
    repo: z.string(),
    title: z.string(),
    body: z.string().nullable(),
    author: z.string(),
    url: z.string(),
    labels: z.array(z.string()),
  }),
  rawPayload: z.unknown(),
});


export const signalIntakeResponseSchema = z.object({
  received: z.boolean(),
  signalId: z.string().uuid().optional(),
  duplicate: z.boolean().optional(),
});



export type SignalIntakeResponse = z.infer<typeof signalIntakeResponseSchema>;
export type NewSignalSchema = z.infer<typeof signalSchema>;