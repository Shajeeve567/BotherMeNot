import styles from "./MetaFooter.module.css";

interface MetaFooterProps {
  right: string;
  className?: string;
}

/** DM Mono meta line at the bottom of Sign In and 404. */
export function MetaFooter({ right, className }: MetaFooterProps) {
  return (
    <footer className={className ? `${styles.footer} ${className}` : styles.footer}>
      <span>© 2026 bother-me-not</span>
      <span>{right}</span>
    </footer>
  );
}
