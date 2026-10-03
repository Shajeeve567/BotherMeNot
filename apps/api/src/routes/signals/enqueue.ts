import { signalQueue, aiQueue } from "@bother-me-not/queue";
import type { ProcessSignalJobData } from "@bother-me-not/contracts";


export async function enqueueSignalProcessing(signalId: string): Promise<void> {
  await signalQueue.add(
    "signal-processing",
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


export async function enqueueAiProcessing(signalId: string): Promise<void> {
  await aiQueue.add(
    "ai-engine-processing",
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


// Decides which evaluator path a signal takes.
// "ai"    → apps/ai-engine (Mastra agent, token cost)
// "rules" → apps/worker   (deterministic, free)
export function routeSignal(type: string): "ai" | "rules" {
  const rulesTypes = new Set(["ci_run_succeeded"]);
  return rulesTypes.has(type) ? "rules" : "ai";
}
