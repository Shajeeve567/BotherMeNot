import { Panel } from "../../components/ui/Panel";
import { PageHeader } from "./PageHeader";
import styles from "./WorkspacePage.module.css";

const COPY = {
  rules: {
    title: "Rules",
    subtitle: "Fine-grained filtering rules are on the way.",
    body: "Until then, each project's AI context is what decides which GitHub events are worth interrupting you for. Edit it from the project's settings.",
  },
  alerts: {
    title: "Alerts",
    subtitle: "A history of what reached you, and why.",
    body: "Delivered alerts will show up here once Slack delivery is live, together with the reason each event was sent or filtered.",
  },
} as const;

/** Placeholder for sidebar tabs whose backend doesn't exist yet. */
export function ComingSoon({ section }: { section: keyof typeof COPY }) {
  const { title, subtitle, body } = COPY[section];
  return (
    <div className={styles.page}>
      <PageHeader title={title} subtitle={subtitle} />
      <Panel eyebrow="NOT AVAILABLE YET" title="Coming soon" description={body} />
    </div>
  );
}
