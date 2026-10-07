import { Job, UnrecoverableError } from "bullmq";
import type { ProcessSignalJobData } from "@bother-me-not/contracts";
import { signalsRepo, projectsRepo } from "@bother-me-not/db";
import { buildInstructions } from "./buildInstructions.js";
import { formatSignal } from "./formatSignal.js";
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
    const result = await evaluateSignal({
      instructions: buildInstructions(project),
      prompt: formatSignal(signal),
      model: resolveModel(),
    });

    await signalsRepo.updateFormatted(signal.id, result);
    await signalsRepo.updateStatus(signal.id, "processed");
    console.log(`[ai-engine] signal ${signal.id}: deliver=${result.deliver} urgency=${result.urgency} model=${result.model}`);
  } catch (err) {
    await signalsRepo.updateStatus(signal.id, "failed");
    throw err;
  }
}