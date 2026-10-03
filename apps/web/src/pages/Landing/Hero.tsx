import { BellOff, BellRing } from "lucide-react";
import { PillLink } from "../../components/PillLink";
import { REPO_URL } from "../../lib/links";
import landing from "./Landing.module.css";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <main className={styles.hero}>
      {/* Decorations: hidden below 1100px */}
      <div aria-hidden="true" className={`${landing.deco} ${styles.buzzer}`}>
        <BellRing size={56} strokeWidth={2.75} />
      </div>
      <div aria-hidden="true" className={`${landing.deco} ${styles.chip} ${styles.chipMuted}`} style={{ left: 40, top: 84, opacity: 0.6, rotate: "-5deg" }}>
        <BellOff size={18} strokeWidth={2.75} />
        <span>CI · build #482 passed</span>
      </div>
      <div aria-hidden="true" className={`${landing.deco} ${styles.chip} ${styles.chipSignal}`} style={{ right: 40, top: 300, rotate: "-3deg" }}>
        <BellRing size={18} strokeWidth={2.75} />
        <span>Review requested on #312</span>
      </div>
      <div aria-hidden="true" className={`${landing.deco} ${styles.chip} ${styles.chipMuted}`} style={{ left: 37, top: 450, opacity: 0.45, rotate: "3deg" }}>
        <BellOff size={18} strokeWidth={2.75} />
        <span>bot commented on #309</span>
      </div>

      <h1 className={styles.wordmark}>{"BOTHER\n  ME NOT"}</h1>
      <p className={styles.tagline}>See what’s important</p>
      <p className={styles.body}>
        A developer notification filter between GitHub and Slack. It decides, per event, whether it’s actually
        worth interrupting you.
      </p>

      <div className={styles.actions}>
        <PillLink variant="ink" to="/signin">
          Get started
        </PillLink>
        <PillLink variant="outline" href={REPO_URL}>
          View on GitHub
        </PillLink>
      </div>

      {/* Screenshot slot: waiting on a real product screenshot. */}
      <div className={styles.screenshot} aria-hidden="true" />
    </main>
  );
}
