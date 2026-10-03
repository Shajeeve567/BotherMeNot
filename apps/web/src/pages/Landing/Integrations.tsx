import { BellRing } from "lucide-react";
import landing from "./Landing.module.css";
import styles from "./Integrations.module.css";

export function Integrations() {
  return (
    <section id="integrations" className={landing.section} aria-labelledby="integrations-heading">
      <h2 id="integrations-heading" className={landing.h2}>
        Integrations
      </h2>
      <p className={landing.sub}>Sits quietly between the tools you already use.</p>

      <div className={styles.panel}>
        <div className={styles.pill}>
          <span className={styles.name}>GitHub</span>
          <span className={styles.caption}>PRs · reviews · CI · issues</span>
        </div>
        <span aria-hidden="true" className={styles.arrow}>→</span>
        <div className={`${styles.pill} ${styles.center}`}>
          <span className={styles.brand}>
            <BellRing size={22} strokeWidth={2.75} aria-hidden="true" />
            BOTHER ME NOT
          </span>
          <span className={styles.caption}>worth interrupting?</span>
        </div>
        <span aria-hidden="true" className={styles.arrow}>→</span>
        <div className={styles.pill}>
          <span className={styles.name}>Slack</span>
          <span className={styles.caption}>only the signal</span>
        </div>
      </div>
    </section>
  );
}
