import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./PillLink.module.css";

interface PillLinkProps {
  variant: "ink" | "outline";
  /** Internal route. */
  to?: string;
  /** External URL, opened in a new tab. */
  href?: string;
  className?: string;
  children: ReactNode;
}

/** 52px pill button used for primary/secondary CTAs across pages. */
export function PillLink({ variant, to, href, className, children }: PillLinkProps) {
  const cls = [styles.pill, styles[variant], className].filter(Boolean).join(" ");

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to ?? "/"} className={cls}>
      {children}
    </Link>
  );
}
