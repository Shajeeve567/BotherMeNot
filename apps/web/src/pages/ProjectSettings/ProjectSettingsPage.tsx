import { useParams, useSearchParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Notice } from "../../components/ui/Notice";
import { Panel } from "../../components/ui/Panel";
import { PillLink } from "../../components/PillLink";
import { Skeleton } from "../../components/ui/Skeleton";
import { ApiError, describeError } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { useProject } from "../../lib/queries";
import { PageHeader } from "../Dashboard/PageHeader";
import page from "../Dashboard/WorkspacePage.module.css";
import { AiModelSection } from "./AiModelSection";
import { DeleteSection } from "./DeleteSection";
import { GeneralSection } from "./GeneralSection";
import { GithubSection } from "./GithubSection";

const BACK = { to: "/dashboard/projects", label: "All projects" };

/** One-shot banners driven by query params (?created=1 after create). */
const ARRIVAL_NOTICES: Record<string, string> = {
  created: "Project created. Next, connect a GitHub repository so its events start flowing in.",
};

export function ProjectSettingsPage() {
  const { projectId = "" } = useParams();
  const project = useProject(projectId);
  const [params, setParams] = useSearchParams();

  const arrival = Object.keys(ARRIVAL_NOTICES).find((k) => params.has(k));
  const dismissArrival = () =>
    setParams(
      (p) => {
        Object.keys(ARRIVAL_NOTICES).forEach((k) => p.delete(k));
        return p;
      },
      { replace: true },
    );

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

      {arrival && (
        <Notice tone="success" onDismiss={dismissArrival}>
          {ARRIVAL_NOTICES[arrival]}
        </Notice>
      )}

      {/* key: if the route switches to another project, start each form fresh. */}
      <GeneralSection key={`general-${p.id}`} project={p} />
      <GithubSection projectId={p.id} />
      <AiModelSection key={`ai-${p.id}`} projectId={p.id} />
      <DeleteSection project={p} />
    </div>
  );
}
