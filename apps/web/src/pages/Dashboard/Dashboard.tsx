import { BellRing, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";
import { Blob } from "../../components/Blob";
import { Grain } from "../../components/Grain";
import { REPO_URL } from "../../lib/links";
import { AccountMenu } from "./AccountMenu";
import styles from "./Dashboard.module.css";

const TABS = [
  { to: "/dashboard/projects", label: "Projects", Icon: LayoutGrid },
  { to: "/dashboard/rules", label: "Rules", Icon: SlidersHorizontal },
  { to: "/dashboard/alerts", label: "Alerts", Icon: BellRing },
] as const;

/** App shell: account button, sidebar, and the frosted workspace that renders the active route. */
export function DashboardLayout() {
  return (
    <div className={styles.page}>
      <Grain />
      <Blob size={620} color="var(--green-800)" opacity={0.85} position={{ left: -230, top: -340 }} />
      <Blob size={560} color="var(--green-600)" opacity={0.75} position={{ right: -240, bottom: -300 }} />

      <AccountMenu />

      <nav aria-label="App" className={styles.sidebar}>
        <Link to="/" aria-label="Bother Me Not home" className={styles.logo}>
          <BellRing size={23} strokeWidth={2.75} aria-hidden="true" />
        </Link>

        <div className={styles.tabs}>
          {/* NavLink stays active on descendants, so Projects lights up on /dashboard/projects/:id too. */}
          {TABS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
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
