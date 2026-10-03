import { BellRing, Funnel, Webhook } from "lucide-react";
import landing from "./Landing.module.css";
import styles from "./HowItWorks.module.css";

const STEPS = [
  {
    Icon: Webhook,
    title: "Connect GitHub",
    body: "Point your repo’s webhooks at bother-me-not. Every PR comment, review, CI run and issue update flows in.",
  },
  {
    Icon: Funnel,
    title: "Judge each event",
    body: "Each event is scored on its own: is it about you, is it blocking, has it changed state? Noise is dropped.",
  },
  {
    Icon: BellRing,
    title: "Ping only what matters",
    body: "The events worth an interruption land in Slack. Everything else stays quiet until you go looking.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className={landing.section} aria-labelledby="how-heading">
      <h2 id="how-heading" className={landing.h2}>
        How it works
      </h2>
      <p className={landing.sub}>Every event gets judged before it reaches you.</p>

      <ol className={styles.grid}>
        {STEPS.map(({ Icon, title, body }, i) => (
          <li key={title} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.number}>{i + 1}</span>
              <span className={styles.iconChip}>
                <Icon size={24} strokeWidth={2.75} aria-hidden="true" />
              </span>
            </div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.body}>{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
