import { CircleAlert, CircleCheck, X } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./Notice.module.css";

interface NoticeProps {
  tone: "error" | "success";
  children: ReactNode;
  onDismiss?: () => void;
}

/** Inline banner: errors are announced immediately, successes politely. */
export function Notice({ tone, children, onDismiss }: NoticeProps) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`${styles.notice} ${styles[tone]}`}>
      <Icon size={18} strokeWidth={2.4} aria-hidden="true" className={styles.icon} />
      <div className={styles.body}>{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className={styles.dismiss}>
          <X size={16} strokeWidth={2.4} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
