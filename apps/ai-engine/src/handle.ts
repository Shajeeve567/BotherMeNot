import { Job } from "bullmq";
import type { ProcessSignalJobData, AIOutput } from "@bother-me-not/contracts";
import { signalsRepo } from "@bother-me-not/db";
import type { SignalRow } from "@bother-me-not/db";
// Get Payload -> Read -> Decision -> Put to channel

export async function handleSignal(job: Job<ProcessSignalJobData>): Promise<void> {
  // 1. GET PAYLOAD
  const signal = await signalsRepo.findById(job.data.signalId);
  if (!signal) throw new Error(`Signal ${job.data.signalId} not found`);
  await signalsRepo.updateStatus(signal.id, "processing");

  try {
    await signalsRepo.updateStatus(signal.id, "processed");
  } catch (err) {
    await signalsRepo.updateStatus(signal.id, "failed");
    throw err;
  }
}
