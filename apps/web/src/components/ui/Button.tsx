import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  /** Shows `pendingLabel` and blocks clicks while a request is in flight. */
  pending?: boolean;
  pendingLabel?: string;
}

export function Button({
  variant = "primary",
  pending = false,
  pendingLabel,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={[styles.button, styles[variant], className].filter(Boolean).join(" ")}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
