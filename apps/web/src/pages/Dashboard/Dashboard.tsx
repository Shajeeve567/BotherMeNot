import {
  ArrowLeft,
  BellRing,
  Brain,
  LayoutGrid,
  Plug,
  Send,
  Settings,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Link, NavLink, Outlet, useMatch } from "react-router";
import { Blob } from "../../components/Blob";
import { Grain } from "../../components/Grain";
import { REPO_URL } from "../../lib/links";
import { AccountMenu } from "./AccountMenu";
import styles from "./Dashboard.module.css";

interface Tab {
  to: string;
  label: string;
  Icon: LucideIcon;
  /** Only active on the exact path (a project's index is a prefix of all its pages). */
  end?: boolean;
}

/** Outside a project: where events come from, then which project. */
const APP_TABS: Tab[] = [
  { to: "/dashboard/connectors", label: "Connectors", Icon: Plug },
  { to: "/dashboard/projects", label: "Projects", Icon: LayoutGrid, end: true },
];

/** Inside a project: that project's own workspace. Alerts is the first thing you see. */
const projectTabs = (base: string): Tab[] => [
  { to: "/dashboard/projects", label: "All projects", Icon: ArrowLeft, end: true },
  { to: base, label: "Alerts", Icon: BellRing, end: true },
  { to: `${base}/context`, label: "AI context", Icon: Brain },
  { to: `${base}/rules`, label: "Rules", Icon: SlidersHorizontal },
  { to: `${base}/deliveries`, label: "Deliveries", Icon: Send },
  { to: `${base}/settings`, label: "Settings", Icon: Settings },
];

/** App shell: account button, sidebar, and the frosted workspace that renders the active route. */
export function DashboardLayout() {
  // The sidebar follows the route: inside a project it shows that project's pages.
  const inProject = useMatch("/dashboard/projects/:projectId/*");
  const projectId = inProject?.params.projectId;
  const tabs = projectId ? projectTabs(`/dashboard/projects/${encodeURIComponent(projectId)}`) : APP_TABS;

  return (
    <div className={styles.page}>
      <Grain />
      <Blob size={620} color="var(--green-800)" opacity={0.85} position={{ left: -230, top: -340 }} />
      <Blob size={560} color="var(--green-600)" opacity={0.75} position={{ right: -240, bottom: -300 }} />

      <AccountMenu />

      <nav
        aria-label={projectId ? "Project" : "App"}
        data-mode={projectId ? "project" : "app"}
        className={styles.sidebar}
      >
        <Link to="/" aria-label="Bother Me Not home" className={styles.logo}>
          <BellRing size={23} strokeWidth={2.75} aria-hidden="true" />
        </Link>

        <div className={styles.tabs}>
          {tabs.map(({ to, label, Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              aria-label={label}
              title={label}
              className={({ isActive }) => (isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab)}
            >
              <Icon size={21} strokeWidth={2.5} aria-hidden="true" />
            </NavLink>
          ))}
        </div>

        <a href={`${REPO_URL}#readme`} target="_blank" rel="noopener" aria-label="Help" title="Help" className={styles.help}>
          <span>?</span>
        </a>
      </nav>

      <main aria-label="Application workspace" className={styles.workspace}>
        <Outlet />
      </main>
    </div>
  );
}
