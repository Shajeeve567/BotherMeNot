import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";
import { aiOutputSchema } from "@bother-me-not/contracts";
import type { EvaluationResult } from "@bother-me-not/contracts";

const signalAgent = new Agent({
  id: "signalAgent",
  name: "Signal Agent",
  instructions: "Analyze signal data and provide helpful insights.",
  model: 'google/gemini-2.5-flash',
  defaultOptions: {
    maxSteps: 100,
    autoResumeSuspendedTools: true,
  },

});


export async function evaluateSignal(prompt: string): Promise<EvaluationResult> {
  const result = await signalAgent.generate(prompt, {
    structuredOutput: {
      schema: aiOutputSchema as any,
    },
  });

  return { ...result.object, evaluator: "ai" as const };
}

export default signalAgent;