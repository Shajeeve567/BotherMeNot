import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export const signalQueue = new Queue("signal-processing", { connection });

export interface ProcessSignalJobData {
  signalId: string;
}

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