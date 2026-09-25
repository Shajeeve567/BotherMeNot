import { Navigate, Outlet } from "react-router";
import { SessionProvider, useSession } from "../lib/session";
import styles from "./RequireAuth.module.css";

function Gate() {
  const { session } = useSession();

  // Plain green ground while /auth/me is in flight, so there's no flash of the sign-in page.
  if (session.status === "loading") return <div className={styles.pending} />;
  if (session.status === "anonymous") return <Navigate to="/signin" replace />;
  return <Outlet />;
}

/** Layout route that loads the session and guards everything beneath it. */
export function RequireAuth() {
  return (
    <SessionProvider>
      <Gate />
    </SessionProvider>
  );
}
