import { Worker, Job } from "bullmq";
import type { ProcessSignalJobData } from "@bother-me-not/contracts";

const connection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export function startWorker(): Worker<ProcessSignalJobData> {
  const worker = new Worker<ProcessSignalJobData>(
    "signal-processing",
    async (job: Job<ProcessSignalJobData>) => {
      console.log(`Processing job ${job.id} for ${job.data.signalId}...`);
    },
    { connection }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully!`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
