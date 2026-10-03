import type { FastifyInstance } from "fastify";
import { createAppAuth } from "@octokit/auth-app";
import { sourceConnectionsRepo } from "@bother-me-not/db";
import { config } from "../../config.js";

export async function registerGithubAppSetupRoute(app: FastifyInstance): Promise<void> {
  app.get("/github-app/setup", async (request, reply) => {
    const { installation_id, state } = request.query as {
      installation_id?: string;
      setup_action?: string;
      state?: string;
    };

    if (!installation_id || !state) {
      return reply.code(400).send({ error: "Missing installation_id or state" });
    }

    let projectId: string;
    try {
      const decoded = app.jwt.verify(state) as unknown as { projectId: string };
      projectId = decoded.projectId;
    } catch {
      return reply.code(400).send({ error: "Invalid or expired state" });
    }

    const auth = createAppAuth({
      appId: config.githubApp.appId,
      privateKey: config.githubApp.privateKey,
    });
    // generate the jwt token with github app credentials
    const { token: appToken } = await auth({ type: "app" });
    // verify the token
    const verifyRes = await fetch(
      `https://api.github.com/app/installations/${installation_id}`,
      {
        headers: {
          Authorization: `Bearer ${appToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "bother-me-not",
        },
      }
    );

    if (!verifyRes.ok) {
      return reply.code(400).send({ error: "Invalid installation" });
    }

    await sourceConnectionsRepo.create({
      projectId,
      sourceType: "github",
      externalId: installation_id,
    });

    return reply.redirect(`${config.webBaseUrl}/dashboard`);
  });
}