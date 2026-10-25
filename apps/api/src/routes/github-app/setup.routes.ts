import type { FastifyInstance } from "fastify";
import { projectsRepo } from "@bother-me-not/db";
import { config } from "../../config.js";
import { userOwnsInstallation } from "./ownership.js";

/**
 * GitHub sends the browser here only right after a fresh install. We don't link anything
 * yet: we confirm the installation really belongs to the user who started the flow, then
 * hand over to the web app, whose repo picker does the actual linking.
 */
export async function registerGithubAppSetupRoute(app: FastifyInstance): Promise<void> {
  app.get("/github-app/setup", async (request, reply) => {
    const { installation_id, setup_action, state } = request.query as {
      installation_id?: string;
      setup_action?: string;
      state?: string;
    };

    // GitHub redirects here after someone edits an existing installation's repositories
    // (when the app has "Redirect on update" on). There is no state then, and nothing to
    // link: send them back to the dashboard, where the repo picker re-reads GitHub.
    if (setup_action === "update" && !state) {
      return reply.redirect(new URL("/dashboard/projects", config.webBaseUrl).toString());
    }

    if (!installation_id || !state || !/^\d{1,20}$/.test(installation_id)) {
      return reply.code(400).send({ error: "Missing or invalid installation_id or state" });
    }

    let projectId: string;
    let userId: string;
    try {
      const decoded = app.jwt.verify(state) as unknown as { projectId?: string; uid?: string };
      if (!decoded.projectId || !decoded.uid) throw new Error("not a connect state");
      projectId = decoded.projectId;
      userId = decoded.uid;
    } catch {
      return reply.code(400).send({ error: "Invalid or expired state" });
    }

    // the project must still belong to the user who started the flow
    const project = await projectsRepo.findById(projectId);
    if (!project || project.userId !== userId) {
      return reply.code(400).send({ error: "Invalid or expired state" });
    }

    // installation_id is guessable and spoofable: GitHub must confirm it is this user's
    if (!(await userOwnsInstallation(userId, installation_id))) {
      return reply.code(400).send({ error: "Invalid installation" });
    }

    const target = new URL(
      `/dashboard/projects/${encodeURIComponent(projectId)}`,
      config.webBaseUrl
    );
    target.searchParams.set("installation", installation_id);
    return reply.redirect(target.toString());
  });
}
