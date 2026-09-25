import { Link } from "react-router";
import { Brand } from "../../components/Brand";
import { REPO_URL } from "../../lib/links";
import styles from "./Nav.module.css";

export function Nav() {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <Brand size="sm" href="#top" />

      <div className={styles.links}>
        <a href="#top" className={`${styles.link} ${styles.active}`} aria-current="page">
          HOME
        </a>
        <a href="#how" className={styles.link}>
          HOW IT WORKS
        </a>
        <a href={REPO_URL} target="_blank" rel="noopener" className={styles.link}>
          GITHUB
        </a>
      </div>

      <Link to="/signin" className={styles.cta}>
        Get started
      </Link>
    </nav>
  );
}
