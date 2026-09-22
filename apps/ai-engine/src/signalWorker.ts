import { Worker } from "bullmq";
import type { ProcessSignalJobData } from "@bother-me-not/contracts";
import { redisConnection, QUEUES } from "@bother-me-not/queue";
import { handleSignal } from "./handle.js";

export function startWorker(): Worker<ProcessSignalJobData> {
  const worker = new Worker<ProcessSignalJobData>(
    QUEUES.AI_ENGINE,
    handleSignal,
    { connection: redisConnection }
  );

  worker.on("completed", (job) => {
    console.log(`[ai-engine] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[ai-engine] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
