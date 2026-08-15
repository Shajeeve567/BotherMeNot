import { Queue } from "bullmq";

export const redisConnection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
};


export const QUEUES = {
  AI_ENGINE: "ai-engine-processing",
  FALLBACK: "signal-processing",
} as const;

export const aiQueue = new Queue(QUEUES.AI_ENGINE, { connection: redisConnection });
export const signalQueue = new Queue(QUEUES.FALLBACK, { connection: redisConnection });





// export async function enqueueAiProcessing(normalizedPayload: NewSignal): Promise<void> {
//   await aiQueue.add(
//     "process-signal",
//     normalizedPayload satisfies NewSignal,
//     {
//       attempts: 3,
//       backoff: {
//         type: "exponential",
//         delay: 1000,
//       },
//       removeOnComplete: true,
//       removeOnFail: { age: 24 * 3600},
//     }
//   );
// }

