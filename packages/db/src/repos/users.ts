import { eq } from "drizzle-orm";
import { db } from "../client.js";
import { users, authIdentities, type UserRow } from "../schema.js";
import { authIdentitiesRepo } from "./authIdentities.js";


export interface GithubProfile{
    id: number;
    login: string;
    email: string | null;
    avatarUrl: string | null;
    accessToken: string;
}



export const usersRepo = {
    async findById(id: string): Promise<UserRow | undefined> {
        const [row] = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        return row;
    },
    async findOrCreateFromGithub(profile: GithubProfile): Promise<UserRow> {
        const providerAccountId = String(profile.id);
        const existingIdentity = await authIdentitiesRepo.findByProviderAccount(
            "github",
            providerAccountId
        );

        // update the token per login through thish
        if(existingIdentity){
            await authIdentitiesRepo.updateAccessToken(existingIdentity.id, profile.accessToken);
            const user = await this.findById(existingIdentity.userId);
            if (!user) throw new Error("Auth identity references a missing user")
            return user;
        }
        // creating new user + authIdentity
        return db.transaction(async (tx) => {
            const [user] = await tx
                .insert(users)
                .values({
                    email: profile.email ?? undefined,
                    displayName: profile.login,
                    avatarUrl: profile.avatarUrl ?? undefined,
                })
                .returning();

                if (!user) throw new Error("Failed to create user");

                await tx.insert(authIdentities).values({
                    userId: user.id,
                    provider: "github",
                    providerAccountId,
                    accessToken: profile.accessToken,
                });

                return user;
        });

    },
};