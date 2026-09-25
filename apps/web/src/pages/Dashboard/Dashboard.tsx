import { BellRing, LayoutGrid, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { Link, NavLink, useParams } from "react-router";
import { Blob } from "../../components/Blob";
import { Grain } from "../../components/Grain";
import { REPO_URL } from "../../lib/links";
import { NotFound } from "../NotFound/NotFound";
import { AccountMenu } from "./AccountMenu";
import styles from "./Dashboard.module.css";

const TABS = [
  { id: "home", label: "Home", Icon: LayoutGrid },
  { id: "rules", label: "Rules", Icon: SlidersHorizontal },
  { id: "alerts", label: "Alerts", Icon: BellRing },
] as const satisfies readonly { id: string; label: string; Icon: LucideIcon }[];

type TabId = (typeof TABS)[number]["id"];

function isTab(value: string | undefined): value is TabId {
  return TABS.some((t) => t.id === value);
}

export function Dashboard() {
  // The active tab lives in the URL (/dashboard/:tab) so it survives reloads and can be linked.
  const { tab } = useParams();
  if (!isTab(tab)) return <NotFound />;

  const label = TABS.find((t) => t.id === tab)!.label;

  return (
    <div className={styles.page}>
      <title>{`${label} · Bother Me Not`}</title>
      <Grain />
      <Blob size={620} color="var(--green-800)" opacity={0.85} position={{ left: -230, top: -340 }} />
      <Blob size={560} color="var(--green-600)" opacity={0.75} position={{ right: -240, bottom: -300 }} />

      <AccountMenu />

      <nav aria-label="App" className={styles.sidebar}>
        <Link to="/" aria-label="Bother Me Not home" className={styles.logo}>
          <BellRing size={23} strokeWidth={2.75} aria-hidden="true" />
        </Link>

        <div className={styles.tabs}>
          {TABS.map(({ id, label, Icon }) => (
            <NavLink
              key={id}
              to={`/dashboard/${id}`}
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

      <section aria-label="Application workspace" className={styles.workspace}>
        {/* Workspace content is still to be designed; show the loading skeleton until then. */}
        <div role="status" aria-label={`${label} loading`} className={styles.skeleton}>
          <span />
          <span style={{ width: "70%" }} />
          <span style={{ width: "84%" }} />
        </div>
      </section>
    </div>
  );
}
