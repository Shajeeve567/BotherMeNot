import { signalViewSchema, type SignalView } from "@bother-me-not/contracts";
import { ExternalLink } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Notice } from "../../components/ui/Notice";
import { Skeleton } from "../../components/ui/Skeleton";
import type { Alert } from "../../lib/alerts";
import { describeError } from "../../lib/api";
import { formatAgo, formatDateTime } from "../../lib/format";
import { useAlerts, useConnections } from "../../lib/queries";
import { useCurrentProject } from "../Project/ProjectLayout";
import styles from "./Alerts.module.css";

const VIEWS: { value: SignalView; label: string }[] = [
  { value: "all", label: "All" },
  { value: "delivered", label: "Delivered" },
  { value: "skipped", label: "Skipped" },
  { value: "failed", label: "Failed" },
];

const EMPTY: Record<SignalView, string> = {
  all: "Nothing has come in yet. Events from the connected repositories show up here as they happen.",
  delivered: "Nothing was important enough to deliver yet.",
  skipped: "Nothing has been filtered out yet.",
  failed: "No failures. Everything that arrived was evaluated.",
};

const TYPE_LABEL: Record<string, string> = {
  issues: "Issue",
  issue_comment: "Comment",
  pull_request: "Pull request",
  check_run: "Check run",
};

export function AlertsPage() {
  const project = useCurrentProject();
  const [params, setParams] = useSearchParams();

  // The URL is the source of truth for the filter, so a filtered view survives a reload.
  const parsedView = signalViewSchema.safeParse(params.get("view"));
  const view: SignalView = parsedView.success ? parsedView.data : "all";

  const alerts = useAlerts(project.id, view);
  const connections = useConnections(project.id);
  const items = alerts.data?.pages.flatMap((p) => p.signals) ?? [];
  const noRepo = connections.isSuccess && connections.data.length === 0;

  const setView = (next: SignalView) =>
    setParams(
      (p) => {
        p.set("view", next);
        return p;
      },
      { replace: true },
    );

  return (
    <>
      <title>{`${project.name} alerts · Bother Me Not`}</title>

      <div className={styles.toolbar}>
        <div className={styles.chips} role="group" aria-label="Show">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              aria-pressed={view === v.value}
              className={styles.chip}
              onClick={() => setView(v.value)}
            >
              {v.label}
            </button>
          ))}
        </div>

        <Button
          variant="secondary"
          onClick={() => void alerts.refetch()}
          pending={alerts.isRefetching && !alerts.isFetchingNextPage}
          pendingLabel="Refreshing…"
        >
          Refresh
        </Button>
      </div>

      {alerts.isPending ? (
        <Skeleton label="Alerts loading" />
      ) : alerts.isError ? (
        <Notice tone="error">{describeError(alerts.error)}</Notice>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          {noRepo ? (
            <>
              No repository is connected to this project yet.{" "}
              <Link to="settings">Connect one in Settings</Link> and its events will show up here.
            </>
          ) : (
            EMPTY[view]
          )}
        </p>
      ) : (
        <>
          <ul className={styles.list} aria-label="Alerts">
            {items.map((a) => (
              <li key={a.id}>
                <AlertCard alert={a} />
              </li>
            ))}
          </ul>
          {alerts.hasNextPage && (
            <div className={styles.more}>
              <Button
                variant="secondary"
                onClick={() => void alerts.fetchNextPage()}
                pending={alerts.isFetchingNextPage}
                pendingLabel="Loading…"
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const { decision } = alert;
  const failed = alert.status === "failed";
  const waiting = !failed && !decision;

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div className={styles.badges}>
          {failed ? (
            <span className={`${styles.badge} ${styles.failed}`}>Failed</span>
          ) : decision ? (
            <>
              <span className={`${styles.badge} ${decision.deliver ? styles.delivered : styles.skipped}`}>
                {decision.deliver ? "Delivered" : "Skipped"}
              </span>
              <span className={`${styles.badge} ${styles[decision.urgency]}`}>{decision.urgency} urgency</span>
            </>
          ) : (
            <span className={`${styles.badge} ${styles.waiting}`}>Evaluating…</span>
          )}
          <span className={styles.type}>{TYPE_LABEL[alert.type] ?? alert.type}</span>
        </div>
        <time className={styles.time} dateTime={alert.receivedAt} title={formatDateTime(alert.receivedAt)}>
          {formatAgo(alert.receivedAt)}
        </time>
      </div>

      <h2 className={styles.title}>
        {alert.title ?? "Untitled event"}
        {alert.url && (
          <a
            href={alert.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            aria-label="Open on GitHub (opens in a new tab)"
          >
            <ExternalLink size={16} strokeWidth={2.4} aria-hidden="true" />
          </a>
        )}
      </h2>

      <p className={styles.meta}>
        {alert.repo ?? "Unknown repository"}
        {alert.author && ` · ${alert.author}`}
      </p>

      {decision && (
        <div className={styles.decision}>
          <p className={styles.summary}>{decision.summary}</p>
          <p className={styles.reason}>{decision.reason}</p>
          <p className={styles.score}>
            Score {decision.score}/100 · {decision.evaluator === "ai" ? (decision.model ?? "AI") : "Rules"}
          </p>
        </div>
      )}

      {failed && <p className={styles.errorText}>{alert.error ?? "Something went wrong while evaluating this event."}</p>}
      {waiting && <p className={styles.reason}>Waiting for the AI to look at this. Refresh in a moment.</p>}
    </article>
  );
}
