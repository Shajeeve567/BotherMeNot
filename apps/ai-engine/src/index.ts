import { assertEncryptionKey } from "@bother-me-not/db";
import { startWorker } from "./signalWorker.js";

assertEncryptionKey();
startWorker();
console.log("[ai-engine] Worker started, listening on ai-engine-processing queue");
