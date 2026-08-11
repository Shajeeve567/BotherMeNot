
import { NewSignal } from "@bother-me-not/domain";
import { string } from "zod/v4";


import type { SignalType } from "@bother-me-not/domain";

function resolveSignalType(
  githubEvent: string,
  payload: Record<string, any>
): SignalType | null {
  if (githubEvent === "issues" && payload.action === "opened") {
    return "issue_created";
  }

  if (githubEvent === "issue_comment" && payload.action === "created") {
    return "issue_commented";
  }

  if (githubEvent === "pull_request" && payload.action === "opened") {
    return "pr_opened";
  }

  if (githubEvent === "pull_request" && payload.action === "synchronize") {
    return "pr_synchronized";
  }

  if (githubEvent === "check_run" && payload.check_run?.conclusion === "failure") {
    return "ci_run_failed";
  }

  if (githubEvent === "check_run" && payload.check_run?.conclusion === "success") {
    return "ci_run_succeeded";
  }

  return null;
}


export function normalizeGithubPayload(
    githubEvent: string,
    deliveryId: string,
    payload: Record<string, any>
): NewSignal | null {
    const type = resolveSignalType(githubEvent, payload)
    if (!type){
        return null;
    }
    const subject = payload.issues ?? payload.pull_request ?? payload.check_run ?? {}

    return {
        source: "github",
        externalId: deliveryId,
        type, 
        payload: {
            repo: payload.repository?.full_name ?? "unknown",
            title: subject.title ?? subject.name ?? "(no title)",
            body: subject.body ?? null,
            author: subject.user?.login ?? payload.sender?.login ?? "unknown",
            url: subject.html_url ?? payload.repository?.html_url ?? "",
            labels: (subject.labels ?? []).map((l: any) => l.name),
        },
        rawPayload: payload,
    }

}