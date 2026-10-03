import type { CSSProperties } from "react";
import styles from "./Blob.module.css";

interface BlobProps {
  size: number;
  color: string;
  opacity?: number;
  /** Absolute position offsets (left/top/right/bottom). */
  position: Pick<CSSProperties, "left" | "top" | "right" | "bottom">;
  className?: string;
}

/** Decorative background circle. */
export function Blob({ size, color, opacity = 1, position, className }: BlobProps) {
  return (
    <span
      aria-hidden="true"
      className={className ? `${styles.blob} ${className}` : styles.blob}
      style={{ width: size, height: size, background: color, opacity, ...position }}
    />
  );
}
