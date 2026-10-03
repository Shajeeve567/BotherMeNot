import { LogOut } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { initialsOf, useSession } from "../../lib/session";
import styles from "./AccountMenu.module.css";

export function AccountMenu() {
  const { session, signOut } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // RequireAuth only renders the dashboard for authenticated sessions.
  if (session.status !== "authenticated") return null;
  const { user } = session;

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={styles.trigger}
      >
        <span className={styles.avatar}>{initialsOf(user)}</span>
      </button>

      {open && (
        <div id={menuId} role="menu" className={styles.menu}>
          <div className={styles.identity}>
            <span className={styles.name}>{user.displayName ?? "Signed in"}</span>
            {user.email && <span className={styles.email}>{user.email}</span>}
          </div>
          <button type="button" role="menuitem" onClick={handleSignOut} className={styles.item}>
            <LogOut size={16} strokeWidth={2.4} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
