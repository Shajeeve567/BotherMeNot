import { Job, UnrecoverableError } from "bullmq";
import type { ProcessSignalJobData } from "@bother-me-not/contracts";
import { signalsRepo, projectsRepo, aiModelConfigsRepo } from "@bother-me-not/db";
import { buildInstructions } from "./buildInstructions.js";
import { formatSignal } from "./formatSignal.js";
import { describeProviderFailure, isPermanentProviderError } from "./providerErrors.js";
import { resolveModel } from "./resolveModel.js";
import { evaluateSignal } from "./signalAgent.js";

export async function handleSignal(job: Job<ProcessSignalJobData>): Promise<void> {
  const signal = await signalsRepo.findById(job.data.signalId);
  if (!signal) throw new UnrecoverableError(`Signal ${job.data.signalId} not found`);
  if (signal.status === "processed") return;

  const project = await projectsRepo.findById(signal.projectId);
  if (!project) throw new UnrecoverableError(`Project ${signal.projectId} not found`);

  await signalsRepo.updateStatus(signal.id, "processing");

  try {
    const aiConfig = await aiModelConfigsRepo.findWithKeyByProjectId(project.id);

    const result = await evaluateSignal({
      instructions: buildInstructions(project),
      prompt: formatSignal(signal),
      model: resolveModel(aiConfig),
    });

    await signalsRepo.updateFormatted(signal.id, result);
    await signalsRepo.updateStatus(signal.id, "processed");
    console.log(`[ai-engine] signal ${signal.id}: deliver=${result.deliver} urgency=${result.urgency} model=${result.model}`);
  } catch (err) {
    // the stored reason is always fixed text, never the provider's own message
    if (isPermanentProviderError(err)) {
      const reason = describeProviderFailure(err);
      await signalsRepo.markFailed(signal.id, reason);
      throw new UnrecoverableError(reason);
    }
    await signalsRepo.markFailed(signal.id, "The AI provider had a temporary problem. Try again later");
    throw err;
  }
}