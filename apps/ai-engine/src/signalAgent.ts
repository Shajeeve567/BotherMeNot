import { Agent } from "@mastra/core/agent";
import { aiOutputSchema } from "@bother-me-not/contracts";
import type { EvaluationResult } from "@bother-me-not/contracts";
import type { ModelConfig } from "./resolveModel.js";

interface EvaluateInput {
  instructions: string;
  prompt: string;
  model: ModelConfig;
}

export async function evaluateSignal({ instructions, prompt, model }: EvaluateInput): Promise<EvaluationResult> {
  const agent = new Agent({
    id: "signalAgent",
    name: "Signal Agent",
    instructions,
    model,
  });

  const result = await agent.generate(prompt, {
    structuredOutput: { schema: aiOutputSchema as any },
  });

  return { ...result.object, evaluator: "ai" as const, model: model.id };
}
