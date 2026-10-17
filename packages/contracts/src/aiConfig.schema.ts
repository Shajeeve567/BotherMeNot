import { z } from "zod";

export const aiProviderSchema = z.enum(["google", "anthropic", "openai"]);

export const upsertAiConfigSchema = z.object({
    provider: aiProviderSchema,
    // no "/" or spaces: the engine builds "<provider>/<model>" from these two fields
    model: z.string().trim().min(1).max(100).regex(/^[\w.:-]+$/, "Model id may only contain letters, digits, . _ : -"),
    // optional so the model can be changed without re-sending a key already stored
    apiKey: z.string().trim().min(16).max(500).optional(),
});

export type AiProvider = z.infer<typeof aiProviderSchema>;
export type UpsertAiConfigBody = z.infer<typeof upsertAiConfigSchema>;
