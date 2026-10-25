import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Notice } from "../../components/ui/Notice";
import { Panel } from "../../components/ui/Panel";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { describeError } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { useProjects } from "../../lib/queries";
import type { Project } from "../../lib/projects";
import { PageHeader } from "../Dashboard/PageHeader";
import page from "../Dashboard/WorkspacePage.module.css";
import { CreateProjectForm } from "./CreateProjectForm";
import styles from "./ProjectsPage.module.css";

export function ProjectsPage() {
  const projects = useProjects();

  return (
    <div className={page.page}>
      <PageHeader title="Projects" subtitle="Each project filters GitHub events for its own repositories." />

      <Panel eyebrow="NEW PROJECT" title="Start a project">
        <CreateProjectForm />
      </Panel>

      <section aria-label="Your projects" className={styles.list}>
        {projects.isPending ? (
          <Skeleton label="Projects loading" />
        ) : projects.isError ? (
          <Notice tone="error">
            {describeError(projects.error)}{" "}
            <Button variant="secondary" onClick={() => void projects.refetch()} className={styles.retry}>
              Try again
            </Button>
          </Notice>
        ) : projects.data.length === 0 ? (
          <p className={styles.empty}>No projects yet. Create your first one above, then connect a GitHub repository to it.</p>
        ) : (
          <ul className={styles.grid}>
            {projects.data.map((p) => (
              <li key={p.id}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/dashboard/projects/${project.id}`} className={styles.card}>
      <span className={styles.cardName}>{project.name}</span>
      <span className={project.aiContext ? styles.cardContext : `${styles.cardContext} ${styles.muted}`}>
        {project.aiContext || "No AI context yet"}
      </span>
      <span className={styles.cardMeta}>
        Created {formatDate(project.createdAt)}
        <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
      </span>
    </Link>
  );
}
