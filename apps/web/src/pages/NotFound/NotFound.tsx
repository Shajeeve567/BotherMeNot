import { BellOff } from "lucide-react";
import { Blob } from "../../components/Blob";
import { Brand } from "../../components/Brand";
import { Grain } from "../../components/Grain";
import { MetaFooter } from "../../components/MetaFooter";
import { PillLink } from "../../components/PillLink";
import styles from "./NotFound.module.css";

export function NotFound() {
  return (
    <div className={styles.page}>
      <title>Not found · Bother Me Not</title>
      <Grain />
      <Blob size={500} color="var(--green-800)" opacity={0.68} position={{ left: -160, top: -210 }} />
      <Blob size={470} color="var(--green-400)" opacity={0.35} position={{ right: -150, bottom: -180 }} />

      <header className={styles.header}>
        <Brand muted />
      </header>

      <main className={styles.main}>
        <div aria-hidden="true" className={styles.numerals}>
          <span className={styles.faint} style={{ rotate: "-4deg" }}>4</span>
          <span style={{ rotate: "-8deg" }}>0</span>
          <span className={styles.faint} style={{ rotate: "3deg" }}>4</span>
        </div>

        <div className={styles.muted}>
          <BellOff size={16} strokeWidth={2.4} aria-hidden="true" />
          <span>THIS ROUTE IS MUTED</span>
        </div>

        <h1 className={styles.title}>
          THIS NOTIFICATION
          <br />
          WENT NOWHERE.
        </h1>
        <p className={styles.body}>
          The page you asked for was judged not worth interrupting you for — very, very quietly.
        </p>

        <div className={styles.actions}>
          <PillLink variant="ink" to="/">
            Back to home
          </PillLink>
          <PillLink variant="outline" to="/dashboard">
            Open dashboard
          </PillLink>
        </div>
      </main>

      <MetaFooter right="Error 404 · filtered" />
    </div>
  );
}
