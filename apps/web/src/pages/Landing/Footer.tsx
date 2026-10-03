import { Link } from "react-router";
import { Brand } from "../../components/Brand";
import { GithubIcon } from "../../components/GithubIcon";
import { REPO_URL } from "../../lib/links";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span aria-hidden="true" className={styles.deco} />

      <div className={styles.grid}>
        <div className={styles.about}>
          <Brand size="lg" href="#top" />
          <p className={styles.tagline}>See what’s important</p>
          <p className={styles.blurb}>Only the GitHub events worth an interruption make it to Slack.</p>
        </div>

        <nav className={styles.column} aria-labelledby="footer-product">
          <span id="footer-product" className={styles.heading}>
            PRODUCT
          </span>
          <a href="#how" className={styles.link}>How it works</a>
          <a href="#integrations" className={styles.link}>Integrations</a>
          <Link to="/signin" className={styles.link}>Get started</Link>
        </nav>

        <nav className={styles.column} aria-labelledby="footer-project">
          <span id="footer-project" className={styles.heading}>
            PROJECT
          </span>
          <a href={REPO_URL} target="_blank" rel="noopener" className={styles.link}>GitHub</a>
          <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener" className={styles.link}>Issues</a>
          <a href={`${REPO_URL}/pulls`} target="_blank" rel="noopener" className={styles.link}>Pull requests</a>
        </nav>
      </div>

      <div className={styles.bottom}>
        <span className={styles.copyright}>© 2026 bother-me-not</span>
        <a href={REPO_URL} target="_blank" rel="noopener" aria-label="GitHub" className={styles.round}>
          <GithubIcon size={20} strokeWidth={2.25} />
        </a>
      </div>
    </footer>
  );
}
