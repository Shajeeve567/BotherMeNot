import { Outlet, useOutletContext, useParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { PillLink } from "../../components/PillLink";
import { Skeleton } from "../../components/ui/Skeleton";
import { ApiError, describeError } from "../../lib/api";
import { formatDate } from "../../lib/format";
import type { Project } from "../../lib/projects";
import { useProject } from "../../lib/queries";
import { PageHeader } from "../Dashboard/PageHeader";
import page from "../Dashboard/WorkspacePage.module.css";

const BACK = { to: "/dashboard/projects", label: "All projects" };

interface ProjectContext {
  project: Project;
}

/** The project the surrounding route has already loaded. Only valid inside ProjectLayout. */
export const useCurrentProject = () => useOutletContext<ProjectContext>().project;

/**
 * Everything about one project lives under this layout: its header and the page picked in
 * the sidebar (alerts, AI context, rules, deliveries, settings). Nothing here is shared
 * across projects, so projects stay separate.
 */
export function ProjectLayout() {
  const { projectId = "" } = useParams();
  const project = useProject(projectId);

  if (project.isPending) return <Skeleton label="Project loading" />;

  if (project.isError) {
    const missing = project.error instanceof ApiError && project.error.status === 404;
    return (
      <div className={page.page}>
        <PageHeader title={missing ? "Project not found" : "Couldn't load project"} back={BACK} />
        <Panel
          title={missing ? "Nothing here" : "Something went wrong"}
          description={missing ? "This project doesn't exist, was deleted, or belongs to someone else." : describeError(project.error)}
        >
          {missing ? (
            <PillLink variant="ink" to="/dashboard/projects">
              Back to projects
            </PillLink>
          ) : (
            <div>
              <Button variant="secondary" onClick={() => void project.refetch()}>
                Try again
              </Button>
            </div>
          )}
        </Panel>
      </div>
    );
  }

  const p = project.data;

  return (
    <div className={page.page}>
      <PageHeader title={p.name} subtitle={`Created ${formatDate(p.createdAt)}`} back={BACK} />

      <Outlet context={{ project: p } satisfies ProjectContext} />
    </div>
  );
}
