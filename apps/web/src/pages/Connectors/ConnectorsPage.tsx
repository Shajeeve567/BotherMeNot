import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { GithubIcon } from "../../components/GithubIcon";
import { PageHeader } from "../Dashboard/PageHeader";
import page from "../Dashboard/WorkspacePage.module.css";
import styles from "./Connectors.module.css";

interface Connector {
  id: string;
  name: string;
  blurb: string;
  icon: ReactNode;
  /** Where the card goes. Connectors without a route are not available yet. */
  to?: string;
}

// Draft: a static list. Only GitHub works today; the rest show what is coming.
const CONNECTORS: Connector[] = [
  {
    id: "github",
    name: "GitHub",
    blurb: "Issues, pull requests, comments and checks from your repositories.",
    icon: <GithubIcon size={26} strokeWidth={2.2} />,
    to: "/dashboard/projects",
  },
  { id: "gitlab", name: "GitLab", blurb: "Merge requests and pipelines.", icon: "G" },
  { id: "slack", name: "Slack", blurb: "Receive alerts in a channel.", icon: "S" },
  { id: "linear", name: "Linear", blurb: "Issues and cycle updates.", icon: "L" },
];

/** First screen after sign-in: where events come from. */
export function ConnectorsPage() {
  return (
    <div className={page.page}>
      <PageHeader
        title="Connectors"
        subtitle="Choose where your events come from. Each connector feeds its own projects."
      />

      <ul className={styles.grid} aria-label="Connectors">
        {CONNECTORS.map((c) => (
          <li key={c.id}>
            {c.to ? (
              <Link to={c.to} className={styles.card}>
                <Body connector={c} />
                <span className={styles.open}>
                  Open projects
                  <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                </span>
              </Link>
            ) : (
              <div className={`${styles.card} ${styles.disabled}`} aria-disabled="true">
                <Body connector={c} />
                <span className={styles.soon}>Coming soon</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Body({ connector }: { connector: Connector }) {
  return (
    <>
      <span className={styles.icon}>{connector.icon}</span>
      <span className={styles.name}>{connector.name}</span>
      <span className={styles.blurb}>{connector.blurb}</span>
    </>
  );
}
