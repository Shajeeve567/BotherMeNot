import { z } from "zod";

// What the AI model is asked to produce
export const aiOutputSchema = z.object({
    deliver: z.boolean().describe("true only if a developer should be interrupted for this now"),
    urgency: z.enum(['high', 'medium', 'low']).describe("high: broken or blocking now; medium: needs a human soon; low: can wait for a digest"),
    reason: z.string().describe("one or two sentences explaining the decision; mention the project context if it influenced you"),
    summary: z.string().describe("one line for a Slack message, written for the developer, no markdown"),
    score: z.number().int().min(0).max(100).describe("importance from 0 to 100, consistent with urgency: high 70+, medium 40-69, low below 40"),
});

// Full result after calling code stamps the evaluator
export const evaluationResultSchema = aiOutputSchema.extend({
    evaluator: z.enum(["ai", "rules"]),
    model: z.string().optional(),
});

export type AIOutput = z.infer<typeof aiOutputSchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

