import { eq, and } from "drizzle-orm";
import { db } from "../client.js";
import { authIdentities, type AuthIdentityRow } from "../schema.js";


// authIdentites repo - handles the oauth provider
export const authIdentitiesRepo = {
  async findByProviderAccount(
    provider: string,
    providerAccountId: string
  ): Promise<AuthIdentityRow | undefined> {
    const [row] = await db
      .select()
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.provider, provider),
          eq(authIdentities.providerAccountId, providerAccountId)
        )
      )
      .limit(1);

    return row;
  },

  async updateAccessToken(
    id: string,
    accessToken: string
  ): Promise<AuthIdentityRow | undefined> {
    const [row] = await db
      .update(authIdentities)
      .set({ accessToken })
      .where(eq(authIdentities.id, id))
      .returning();

    return row;
  },
};

