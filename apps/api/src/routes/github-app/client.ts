import { createAppAuth } from "@octokit/auth-app";
import { config } from "../../config.js";

const GITHUB_API = "https://api.github.com";
const MAX_PAGES = 10; // 1000 repos is plenty for a picker

export interface GithubInstallation {
  id: string;
  accountId: string;
  accountType: string; // "User" | "Organization"
}

export interface GithubRepo {
  id: string;
  fullName: string;
  private: boolean;
}

const auth = createAppAuth({
  appId: config.githubApp.appId,
  privateKey: config.githubApp.privateKey,
});

async function githubGet(path: string, token: string): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "bother-me-not",
    },
  });
}

/** Asks GitHub (as the app) about an installation. Null if it doesn't exist (spoofed or uninstalled). */
export async function getInstallation(installationId: string): Promise<GithubInstallation | null> {
  const { token } = await auth({ type: "app" });
  const res = await githubGet(`/app/installations/${encodeURIComponent(installationId)}`, token);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub installation lookup failed: ${res.status}`);

  const body = (await res.json()) as { id: number; account: { id: number; type: string } | null };
  if (!body.account) return null;
  return {
    id: String(body.id),
    accountId: String(body.account.id),
    accountType: body.account.type,
  };
}

/** Repos the installation can see right now. Null if the installation is gone. */
export async function listInstallationRepos(installationId: string): Promise<GithubRepo[] | null> {
  let token: string;
  try {
    ({ token } = await auth({ type: "installation", installationId: Number(installationId) }));
  } catch {
    return null; // installation deleted or token couldn't be minted
  }

  const repos: GithubRepo[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await githubGet(`/installation/repositories?per_page=100&page=${page}`, token);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub repository listing failed: ${res.status}`);

    const body = (await res.json()) as {
      repositories: { id: number; full_name: string; private: boolean }[];
    };
    for (const r of body.repositories) {
      repos.push({ id: String(r.id), fullName: r.full_name, private: r.private });
    }
    if (body.repositories.length < 100) break;
  }
  return repos;
}

/**
 * Finds the app installation on a GitHub account (by numeric account id), or null if the
 * app isn't installed there. Lets us skip the install page when it's already installed.
 * The app-level JWT only works on /app/* endpoints, so this pages through the app's own
 * installations; fine while installs are few, revisit (e.g. store the id) if they grow.
 */
export async function findInstallationForAccount(accountId: string): Promise<GithubInstallation | null> {
  const { token } = await auth({ type: "app" });

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await githubGet(`/app/installations?per_page=100&page=${page}`, token);
    if (!res.ok) throw new Error(`GitHub installation listing failed: ${res.status}`);

    const body = (await res.json()) as { id: number; account: { id: number; type: string } | null }[];
    const match = body.find((i) => i.account && String(i.account.id) === accountId);
    if (match?.account) {
      return { id: String(match.id), accountId, accountType: match.account.type };
    }
    if (body.length < 100) break;
  }
  return null;
}
