

export type SignalSource = "github";


export type SignalType =
  | "issue_created"
  | "issue_commented"
  | "pr_opened"
  | "pr_synchronized"
  | "ci_run_failed"
  | "ci_run_succeeded";



export type SignalStatus = "received" | "processing" | "processed" | "failed";

export interface SignalPayload {
  repo: string; 
  title: string;
  body: string | null;
  author: string;
  url: string;
  labels: string[];
}

export interface Signal {
    id: string;
    source: SignalSource;
    externalId: string;
    type: SignalType;
    payload: SignalPayload;
    rawPayload: unknown;
    receivedAt: Date;
    status: SignalStatus;
}

export type NewSignal = Omit<Signal, "id" | "receivedAt" | "status"> & {
  status?: SignalStatus;
};
