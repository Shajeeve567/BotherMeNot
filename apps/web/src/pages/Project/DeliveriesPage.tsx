import { Link } from "react-router";
import { Notice } from "../../components/ui/Notice";
import { Panel } from "../../components/ui/Panel";
import { Skeleton } from "../../components/ui/Skeleton";
import { describeError } from "../../lib/api";
import { formatAgo } from "../../lib/format";
import { useAlerts } from "../../lib/queries";
import { useCurrentProject } from "./ProjectLayout";
import styles from "./ProjectPages.module.css";

/**
 * Where alerts went. Draft: Slack delivery is not built, so this lists the alerts the AI
 * decided to deliver and says plainly that nothing has been sent yet.
 */
export function DeliveriesPage() {
  const project = useCurrentProject();
  const delivered = useAlerts(project.id, "delivered");
  const items = delivered.data?.pages.flatMap((p) => p.signals) ?? [];

  return (
    <>
      <title>{`${project.name} deliveries · Bother Me Not`}</title>

      <Panel
        eyebrow="DRAFT"
        title="Not sent anywhere yet"
        description="Slack delivery is not connected, so nothing below has reached you. These are the alerts the AI decided were worth sending."
      />

      {delivered.isPending ? (
        <Skeleton label="Deliveries loading" />
      ) : delivered.isError ? (
        <Notice tone="error">{describeError(delivered.error)}</Notice>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          Nothing to deliver yet. <Link to={`/dashboard/projects/${project.id}`}>See all alerts</Link>.
        </p>
      ) : (
        <ul className={styles.rows} aria-label="Alerts waiting for delivery">
          {items.map((a) => (
            <li key={a.id} className={styles.row}>
              <span className={styles.rowTitle}>{a.decision?.summary ?? a.title ?? "Untitled event"}</span>
              <span className={styles.rowMeta}>
                {a.repo ?? "Unknown repository"} · {formatAgo(a.receivedAt)}
              </span>
              <span className={styles.badge}>No destination</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
