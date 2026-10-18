import { authIdentitiesRepo } from "@bother-me-not/db";
import { getInstallation } from "./client.js";

/**
 * True when this installation sits on the user's own personal GitHub account.
 * The installation id alone is never trusted: it is guessable, so we ask GitHub who owns it.
 * (Organization installs can't be tied to a user without a user-to-server token; not supported yet.)
 */
export async function userOwnsInstallation(userId: string, installationId: string): Promise<boolean> {
  const identity = await authIdentitiesRepo.findByUserId(userId, "github");
  if (!identity) return false;

  const installation = await getInstallation(installationId);
  return (
    installation !== null &&
    installation.accountType === "User" &&
    installation.accountId === identity.providerAccountId
  );
}
