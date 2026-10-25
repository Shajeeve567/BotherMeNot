import { useId, type ReactNode } from "react";
import styles from "./Field.module.css";

/** Props to spread onto the control so it's labelled and announces its hint/error. */
export interface ControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** Character counter, e.g. { value: 1240, max: 2000 }. */
  count?: { value: number; max: number };
  children: (control: ControlProps) => ReactNode;
}

export function Field({ label, hint, error, count, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const countId = `${id}-count`;
  const over = count ? count.value > count.max : false;

  const describedBy = [hint && hintId, count && countId, error && errorId].filter(Boolean).join(" ");

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {count && (
          <span id={countId} className={over ? `${styles.count} ${styles.countOver}` : styles.count}>
            {count.value}/{count.max}
          </span>
        )}
      </div>
      {children({ id, "aria-describedby": describedBy || undefined, "aria-invalid": error ? true : undefined })}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Shared control styling, so inputs, textareas and selects match. */
export const controlClass = styles.control;
