import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  back?: { to: string; label: string };
}

/** Heading block at the top of each workspace page. Also sets the tab title. */
export function PageHeader({ title, subtitle, back }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <title>{`${title} · Bother Me Not`}</title>
      {back && (
        <Link to={back.to} className={styles.back}>
          <ArrowLeft size={16} strokeWidth={2.4} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
  );
}
