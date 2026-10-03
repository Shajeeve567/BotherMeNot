import styles from "./Grain.module.css";

/** Full-bleed noise overlay. Sits above the green ground, below content (give content z-index ≥ 1). */
export function Grain() {
  return <div aria-hidden="true" className={styles.grain} />;
}
