import { useEffect } from "react";
import { GithubIcon } from "../../components/GithubIcon";
import { Button } from "../../components/ui/Button";
import { Notice } from "../../components/ui/Notice";
import { Panel } from "../../components/ui/Panel";
import { describeError } from "../../lib/api";
import { useConnectGithub } from "../../lib/queries";
import styles from "./Settings.module.css";

export function GithubSection({ projectId }: { projectId: string }) {
  const connect = useConnectGithub(projectId);
  const { reset } = connect;

  // Pressing Back from GitHub can restore this page from the browser's cache with the
  // button still busy; reset it so the user can try again.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && reset();
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [reset]);

  // After success the tab is navigating away; keep the button busy until it does.
  const leaving = connect.isPending || connect.isSuccess;

  return (
    <Panel
      eyebrow="GITHUB"
      title="Connect repositories"
      description="Install the Bother Me Not GitHub App and pick the repositories this project should watch. You'll come back here when you're done."
    >
      <div className={styles.form}>
        {connect.isError && <Notice tone="error">{describeError(connect.error)}</Notice>}
        <div>
          {/* The install link is requested on click (it expires after 10 minutes). */}
          <Button onClick={() => connect.mutate()} pending={leaving} pendingLabel="Opening GitHub…">
            <GithubIcon size={18} />
            Connect GitHub
          </Button>
        </div>
        <p className={styles.note}>
          Connected repositories aren't listed here yet. To add or remove repositories later, run Connect GitHub
          again and change the selection on GitHub.
        </p>
      </div>
    </Panel>
  );
}
