import { Link } from "react-router";
import { Panel } from "../../components/ui/Panel";
import { useCurrentProject } from "./ProjectLayout";
import styles from "./ProjectPages.module.css";

/** What the AI is told about this project. Learned context is a later step. */
export function AiContextPage() {
  const project = useCurrentProject();

  return (
    <>
      <title>{`${project.name} AI context · Bother Me Not`}</title>

      <Panel
        eyebrow="YOU WROTE"
        title="Project context"
        description="Added to every evaluation for this project, so the AI knows what matters here."
      >
        {project.aiContext ? (
          <p className={styles.quote}>{project.aiContext}</p>
        ) : (
          <p className={styles.muted}>No context yet, so the AI uses its default judgement.</p>
        )}
        <div>
          <Link to={`/dashboard/projects/${project.id}/settings`} className={styles.link}>
            Edit in Settings
          </Link>
        </div>
      </Panel>

      <Panel
        eyebrow="DRAFT"
        title="Learned by the AI"
        description="Patterns the AI picks up from your alerts over time will be listed here. Not available yet."
      />
    </>
  );
}
