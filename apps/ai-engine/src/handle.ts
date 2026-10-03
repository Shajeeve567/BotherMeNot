import { Job } from "bullmq";
import type { ProcessSignalJobData, EvaluationResult } from "@bother-me-not/contracts";
import { signalsRepo } from "@bother-me-not/db";
import type { SignalRow } from "@bother-me-not/db";
import { evaluateSignal } from "./signalAgent.js";
// Get Payload -> Read -> Decision -> Put to channel

export async function handleSignal(job: Job<ProcessSignalJobData>): Promise<void> {
  // 1. GET PAYLOAD
  const signal = await signalsRepo.findById(job.data.signalId);
  if (!signal) throw new Error(`Signal ${job.data.signalId} not found`);
  await signalsRepo.updateStatus(signal.id, "processing");

  // send to ai
  const result = await evaluateSignal(`The signal that needed human intervention: ${signal}`);
  console.log({...result});
  

  try {
    await signalsRepo.updateStatus(signal.id, "processed");
  } catch (err) {
    await signalsRepo.updateStatus(signal.id, "failed");
    throw err;
  }
}

