import { and, eq } from "drizzle-orm";
import { db } from "../client.js";
import { aiModelConfigs } from "../schema.js";
import { encryptSecret, decryptSecret } from "../crypto.js";

export interface UpsertAiModelConfigInput {
  provider: string;
  model: string;
  apiKey?: string;
}

export interface PublicAiModelConfig {
  provider: string;
  model: string;
  keyHint: string;
  updatedAt: Date;
}

export interface AiModelConfigWithKey {
  provider: string;
  model: string;
  apiKey: string;
}

export type UpsertAiModelConfigResult =
  | { status: "saved"; config: PublicAiModelConfig }
  | { status: "key_required" } // nothing stored yet and no key supplied
  | { status: "provider_change_needs_key" }; // provider differs from the stored one and no key supplied

const publicColumns = {
  provider: aiModelConfigs.provider,
  model: aiModelConfigs.model,
  keyHint: aiModelConfigs.keyHint,
  updatedAt: aiModelConfigs.updatedAt,
};

export const aiModelConfigsRepo = {
  // Never selects the encrypted key, so it cannot leak through this method.
  async findPublicByProjectId(projectId: string): Promise<PublicAiModelConfig | undefined> {
    const [row] = await db
      .select(publicColumns)
      .from(aiModelConfigs)
      .where(eq(aiModelConfigs.projectId, projectId))
      .limit(1);
    return row;
  },

  // For the AI engine only: this is the one method that returns a decrypted key.
  async findWithKeyByProjectId(projectId: string): Promise<AiModelConfigWithKey | undefined> {
    const [row] = await db
      .select()
      .from(aiModelConfigs)
      .where(eq(aiModelConfigs.projectId, projectId))
      .limit(1);
    if (!row) return undefined;

    return {
      provider: row.provider,
      model: row.model,
      apiKey: decryptSecret(row.apiKeyEncrypted, projectId),
    };
  },

  // Invariant: the stored key always belongs to the stored provider. Without a new key,
  // the update below only matches a row whose provider is unchanged, so a provider switch
  // cannot slip through, even if two requests race.
  async upsert(
    projectId: string,
    input: UpsertAiModelConfigInput
  ): Promise<UpsertAiModelConfigResult> {
    const { provider, model, apiKey } = input;
    const updatedAt = new Date();

    if (apiKey) {
      const apiKeyEncrypted = encryptSecret(apiKey, projectId);
      const keyHint = apiKey.slice(-4);

      const [row] = await db
        .insert(aiModelConfigs)
        .values({ projectId, provider, model, apiKeyEncrypted, keyHint })
        .onConflictDoUpdate({
          target: aiModelConfigs.projectId,
          set: { provider, model, apiKeyEncrypted, keyHint, updatedAt },
        })
        .returning(publicColumns);
      if (!row) throw new Error("Failed to save AI model config");
      return { status: "saved", config: row };
    }

    const [updated] = await db
      .update(aiModelConfigs)
      .set({ model, updatedAt })
      .where(and(eq(aiModelConfigs.projectId, projectId), eq(aiModelConfigs.provider, provider)))
      .returning(publicColumns);
    if (updated) return { status: "saved", config: updated };

    // Nothing matched. This read only decides which message to give; the guarantee
    // above does not depend on it.
    const [existing] = await db
      .select({ id: aiModelConfigs.id })
      .from(aiModelConfigs)
      .where(eq(aiModelConfigs.projectId, projectId))
      .limit(1);
    return { status: existing ? "provider_change_needs_key" : "key_required" };
  },

  async deleteByProjectId(projectId: string): Promise<boolean> {
    const rows = await db
      .delete(aiModelConfigs)
      .where(eq(aiModelConfigs.projectId, projectId))
      .returning({ id: aiModelConfigs.id });
    return rows.length > 0;
  },
};
