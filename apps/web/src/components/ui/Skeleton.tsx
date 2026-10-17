import styles from "./Skeleton.module.css";

/** The handoff's 3-bar loading placeholder. */
export function Skeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className={styles.skeleton}>
      <span />
      <span style={{ width: "70%" }} />
      <span style={{ width: "84%" }} />
    </div>
  );
}
