import { Queue } from "bullmq";
import type { ProcessSignalJobData } from "@bother-me-not/contracts";



const connection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export const signalQueue = new Queue("signal-processing", { connection });

export async function enqueueSignalProcessing(signalId: string): Promise<void> {
  await signalQueue.add(
    "process-signal",
    { signalId } satisfies ProcessSignalJobData,
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: { age: 24 * 3600},
    }
  );
}