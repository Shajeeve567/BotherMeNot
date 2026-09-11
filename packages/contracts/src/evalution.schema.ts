import { z } from "zod";

// What the AI model is asked to produce
export const aiOutputSchema = z.object({
    deliver: z.boolean(),
    urgency: z.enum(['high', 'medium', 'low']),
    reason: z.string(),
    summary: z.string(),
    score: z.number(),
});

// Full result after calling code stamps the evaluator
export const evaluationResultSchema = aiOutputSchema.extend({
    evaluator: z.enum(["ai", "rules"]),
});

export type AIOutput = z.infer<typeof aiOutputSchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

