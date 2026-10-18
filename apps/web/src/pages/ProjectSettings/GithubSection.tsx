import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { GithubIcon } from "../../components/GithubIcon";
import { Button } from "../../components/ui/Button";
import { ConfirmButton } from "../../components/ui/ConfirmButton";
import { Notice } from "../../components/ui/Notice";
import { Panel } from "../../components/ui/Panel";
import { ApiError, describeError } from "../../lib/api";
import {
  useConnections,
  useConnectGithub,
  useDisconnectRepo,
  useGithubRepos,
  useLinkRepo,
} from "../../lib/queries";
import repos from "./Repos.module.css";
import styles from "./Settings.module.css";

// GitHub installation ids are numeric; anything else in the URL is ignored.
const isInstallationId = (v: string | null): v is string => v !== null && /^\d{1,20}$/.test(v);

const installationSettingsUrl = (installationId: string) =>
  `https://github.com/settings/installations/${installationId}`;

export function GithubSection({ projectId }: { projectId: string }) {
  const [params, setParams] = useSearchParams();
  // Set after a fresh install (GitHub redirects back with ?installation=ID) or when the
  // app was already installed and the API told us which installation to browse.
  const [installationId, setInstallationId] = useState<string | null>(() => {
    const fromUrl = params.get("installation");
    return isInstallationId(fromUrl) ? fromUrl : null;
  });

  // The id is now in state; drop it from the URL so a refresh doesn't reopen the picker.
  useEffect(() => {
    if (!params.has("installation")) return;
    setParams(
      (p) => {
        p.delete("installation");
        return p;
      },
      { replace: true },
    );
  }, [params, setParams]);

  const connections = useConnections(projectId);
  const disconnect = useDisconnectRepo(projectId);
  const connect = useConnectGithub(projectId, setInstallationId);
  const { reset } = connect;

  // Pressing Back from GitHub can restore this page from the browser's cache with the
  // button still busy; reset it so the user can try again.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => e.persisted && reset();
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [reset]);

  // A fresh install navigates the tab away; keep the button busy until it does. When the app
  // is already installed nothing navigates, so only the in-flight request counts.
  const leaving = connect.isPending || (connect.isSuccess && "installUrl" in connect.data);
  const connected = connections.data ?? [];

  return (
    <Panel
      eyebrow="GITHUB"
      title="Repositories"
      description="Choose the repositories this project should watch. Each repository can feed one project; one GitHub installation serves all of yours."
    >
      <div className={styles.form}>
        {connections.isError && <Notice tone="error">{describeError(connections.error)}</Notice>}
        {disconnect.isError && <Notice tone="error">{describeError(disconnect.error)}</Notice>}
        {connect.isError && <Notice tone="error">{describeError(connect.error)}</Notice>}

        {connected.length > 0 && (
          <ul className={repos.list} aria-label="Connected repositories">
            {connected.map((c) => (
              <li key={c.id} className={repos.row}>
                <span className={repos.name}>{c.repoFullName}</span>
                <ConfirmButton
                  variant="secondary"
                  confirmLabel="Confirm"
                  pendingLabel="Removing…"
                  pending={disconnect.isPending && disconnect.variables === c.id}
                  onConfirm={() => disconnect.mutate(c.id)}
                >
                  Disconnect
                </ConfirmButton>
              </li>
            ))}
          </ul>
        )}

        {connections.isSuccess && connected.length === 0 && !installationId && (
          <p className={styles.note}>No repositories connected yet. Events only flow in once you connect one.</p>
        )}

        {installationId ? (
          <RepoPicker
            projectId={projectId}
            installationId={installationId}
            connectedIds={new Set(connected.map((c) => c.repoId))}
            onClose={() => setInstallationId(null)}
          />
        ) : (
          <div>
            {/* The install link is requested on click (it expires after 10 minutes). */}
            <Button onClick={() => connect.mutate()} pending={leaving} pendingLabel="Checking GitHub…">
              <GithubIcon size={18} />
              {connected.length > 0 ? "Add another repository" : "Connect GitHub"}
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}

function RepoPicker({
  projectId,
  installationId,
  connectedIds,
  onClose,
}: {
  projectId: string;
  installationId: string;
  connectedIds: Set<string>;
  onClose: () => void;
}) {
  const available = useGithubRepos(projectId, installationId);
  const link = useLinkRepo(projectId, installationId);

  return (
    <div className={repos.picker}>
      <div className={repos.pickerHead}>
        <span className={repos.pickerTitle}>Pick a repository</span>
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>

      {available.isPending && <p className={styles.note}>Loading repositories from GitHub…</p>}

      {available.isError && (
        <Notice tone="error">
          {available.error instanceof ApiError && available.error.status === 404
            ? "GitHub could not find this installation. Close this and try Connect again."
            : describeError(available.error)}
        </Notice>
      )}

      {link.isError && (
        <Notice tone="error">
          {link.error instanceof ApiError && link.error.status === 409
            ? "That repository is already connected to another project."
            : describeError(link.error)}
        </Notice>
      )}

      {available.data && available.data.length === 0 && (
        <p className={styles.note}>
          The app cannot see any repositories yet.{" "}
          <a href={installationSettingsUrl(installationId)} target="_blank" rel="noopener noreferrer">
            Choose repositories on GitHub
          </a>
          , then reopen this list.
        </p>
      )}

      {available.data && available.data.length > 0 && (
        <>
          <ul className={repos.list} aria-label="Available repositories">
            {available.data.map((r) => {
              const here = connectedIds.has(r.id);
              const elsewhere = r.linkedProjectId !== null && !here;
              return (
                <li key={r.id} className={repos.row}>
                  <span className={repos.name}>
                    {r.fullName}
                    {r.private && <span className={repos.meta}>private</span>}
                  </span>
                  {here ? (
                    <span className={repos.meta}>Connected</span>
                  ) : elsewhere ? (
                    <span className={repos.meta}>Used by another project</span>
                  ) : (
                    <Button
                      variant="secondary"
                      pending={link.isPending && link.variables === r.id}
                      pendingLabel="Connecting…"
                      disabled={link.isPending}
                      onClick={() => link.mutate(r.id)}
                    >
                      Connect
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className={styles.note}>
            Do not see a repository?{" "}
            <a href={installationSettingsUrl(installationId)} target="_blank" rel="noopener noreferrer">
              Give the app access on GitHub
            </a>
            , then reopen this list.
          </p>
        </>
      )}
    </div>
  );
}
