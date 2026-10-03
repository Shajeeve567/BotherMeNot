import Fastify from "fastify";
import { registerRawBody } from "./plugins/raw-body.js";
import { registerAuth } from "./plugins/auth.js";
import { registerAuthRoutes } from "./routes/auth/auth.routes.js";
import { registerErrorHandler } from "./plugins/error-handler.js"; 
import { registerProjectRoutes } from "./routes/projects/projects.routes.js";
import { registerGithubAppSetupRoute } from "./routes/github-app/setup.routes.js";
import { registerGithubAppWebhookRoute } from "./routes/github-app/webhook.routes.js";



async function main() {

  const app = Fastify({ logger: true });
  await registerErrorHandler(app);
  
  app.get("/health", async () => ({ status: "ok" }));
  
  await registerRawBody(app);
  await registerAuth(app);
  await registerAuthRoutes(app);
  await registerProjectRoutes(app);
  await registerGithubAppSetupRoute(app);
  await registerGithubAppWebhookRoute(app);

  const port = Number(process.env.PORT ?? 3000);

  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
