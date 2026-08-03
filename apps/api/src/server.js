import Fastify from "fastify";

async function buildServer() {
  const app = Fastify({ logger: true });

  await registerRawBodyCapture(app);

  app.get("/health", async () => ({ status: "ok" }));

  await registerSignalRoutes(app);

  return app;
}

async function main() {
  const app = await buildServer();
  const port = Number(process.env.PORT ?? 3000);

  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
