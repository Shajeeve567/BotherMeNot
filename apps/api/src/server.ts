import Fastify from "fastify";
import { registerRawBody } from "./plugins/raw-body.js";
import { registerAuth } from "./plugins/auth.js";
import { registerAuthRoutes } from "./routes/auth/auth.routes.js";
import { registerSignalRoutes } from "./routes/signals/signal.routes.js";


async function main() {

  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));

  await registerRawBody(app);
  await registerAuth(app);
  await registerAuthRoutes(app);
  await registerSignalRoutes(app);

  const port = Number(process.env.PORT ?? 3000);

  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
