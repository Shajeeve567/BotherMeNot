import { BellOff, BellRing } from "lucide-react";
import { Link } from "react-router";
import styles from "./Brand.module.css";

const SIZES = {
  sm: { chip: 32, icon: 18 }, // landing nav
  md: { chip: 36, icon: 22 }, // page headers
  lg: { chip: 48, icon: 26 }, // landing footer
} as const;

interface BrandProps {
  size?: keyof typeof SIZES;
  /** 404 uses the muted bell. */
  muted?: boolean;
  /** In-page anchor (e.g. "#top"); otherwise links to the landing route. */
  href?: string;
}

export function Brand({ size = "md", muted = false, href }: BrandProps) {
  const { chip, icon } = SIZES[size];
  const Icon = muted ? BellOff : BellRing;

  const content = (
    <>
      <span className={styles.chip} style={{ width: chip, height: chip }}>
        <Icon size={icon} strokeWidth={2.75} aria-hidden="true" />
      </span>
      <span className={styles.word}>BOTHER ME NOT</span>
    </>
  );

  const className = `${styles.brand} ${styles[size]}`;
  return href ? (
    <a href={href} className={className} aria-label="Bother Me Not home">
      {content}
    </a>
  ) : (
    <Link to="/" className={className} aria-label="Bother Me Not home">
      {content}
    </Link>
  );
}
