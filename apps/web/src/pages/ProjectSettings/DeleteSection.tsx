import { useNavigate } from "react-router";
import { ConfirmButton } from "../../components/ui/ConfirmButton";
import { Notice } from "../../components/ui/Notice";
import { Panel } from "../../components/ui/Panel";
import { describeError } from "../../lib/api";
import type { Project } from "../../lib/projects";
import { useDeleteProject } from "../../lib/queries";
import styles from "./Settings.module.css";

export function DeleteSection({ project }: { project: Project }) {
  const navigate = useNavigate();
  const del = useDeleteProject(project.id);

  return (
    <Panel
      tone="danger"
      eyebrow="DANGER ZONE"
      title="Delete project"
      description={`Deletes "${project.name}" along with its AI context and model settings. This can't be undone.`}
    >
      <div className={styles.form}>
        {del.isError && <Notice tone="error">{describeError(del.error)}</Notice>}
        <div>
          <ConfirmButton
            confirmLabel="Click again to delete"
            pending={del.isPending}
            pendingLabel="Deleting…"
            onConfirm={() => del.mutate(undefined, { onSuccess: () => navigate("/dashboard/projects", { replace: true }) })}
          >
            Delete project
          </ConfirmButton>
        </div>
      </div>
    </Panel>
  );
}
