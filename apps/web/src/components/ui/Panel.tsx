import { useId, type ReactNode } from "react";
import styles from "./Panel.module.css";

interface PanelProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  tone?: "default" | "danger";
  children?: ReactNode;
}

/** Paper card for one settings section, in the Sign In card's language. */
export function Panel({ eyebrow, title, description, tone = "default", children }: PanelProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={tone === "danger" ? `${styles.panel} ${styles.danger}` : styles.panel}>
      <header className={styles.header}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>
      {children}
    </section>
  );
}
