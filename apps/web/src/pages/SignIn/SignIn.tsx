import { BellRing } from "lucide-react";
import { Blob } from "../../components/Blob";
import { Brand } from "../../components/Brand";
import { GithubIcon } from "../../components/GithubIcon";
import { Grain } from "../../components/Grain";
import { MetaFooter } from "../../components/MetaFooter";
import { GITHUB_LOGIN_URL } from "../../lib/api";
import { REPO_URL } from "../../lib/links";
import styles from "./SignIn.module.css";

export function SignIn() {
  return (
    <div className={styles.page}>
      <title>Sign in · Bother Me Not</title>
      <Grain />
      <Blob className={styles.deco} size={620} color="var(--green-800)" opacity={0.85} position={{ left: -230, top: -340 }} />
      <Blob className={styles.deco} size={520} color="var(--green-600)" opacity={0.7} position={{ right: -180, bottom: -260 }} />
      <Blob className={styles.deco} size={27} color="var(--mint-300)" opacity={0.9} position={{ left: 80, bottom: 110 }} />

      <header className={styles.header}>
        <Brand />
        <a href={REPO_URL} target="_blank" rel="noopener" className={styles.repoLink}>
          <span>
            <span className={styles.repoVerb}>View on </span>GitHub
          </span>
          <span aria-hidden="true" className={styles.repoArrow}>↗</span>
        </a>
      </header>

      <main className={styles.main}>
        <section className={styles.pitch}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            <span>YOUR NOTIFICATION FILTER</span>
          </div>
          <h1 className={styles.title}>
            MAKE THE
            <br />
            <span className={styles.noise}>noise</span> WAIT.
          </h1>
          <p className={styles.lede}>
            Connect GitHub and decide what earns your attention—before it interrupts your day.
          </p>

          <div className={styles.events} aria-label="Example: one event filtered, one sent">
            <div className={styles.event}>
              <span className={styles.dotMuted} />
              <span className={styles.eventText}>CI · build #482 passed</span>
              <span className={styles.tag}>FILTERED</span>
            </div>
            <div className={`${styles.event} ${styles.eventSent}`}>
              <span className={styles.dotSignal} />
              <span className={styles.eventText}>Review requested on #312</span>
              <span className={styles.tag}>SENT TO YOU</span>
            </div>
          </div>

          <p className={styles.focus}>
            <span aria-hidden="true">✦</span> Built for developers who value focus.
          </p>
        </section>

        <section className={styles.card} aria-labelledby="signin-heading">
          <div className={styles.tile}>
            <BellRing size={25} strokeWidth={2.75} aria-hidden="true" />
          </div>
          <span className={styles.welcome}>WELCOME BACK</span>
          <h2 id="signin-heading" className={styles.cardTitle}>
            Sign in to
            <br />
            your quiet.
          </h2>
          <p className={styles.cardBody}>
            Use your GitHub account to connect your repositories and start filtering the noise.
          </p>

          {/* Full-page navigation: the API redirects to GitHub, then back to /dashboard. */}
          <a href={GITHUB_LOGIN_URL} className={styles.githubButton}>
            <GithubIcon size={22} />
            <span>Continue with GitHub</span>
            <span aria-hidden="true" className={styles.arrow}>→</span>
          </a>

          <div className={styles.divider} aria-hidden="true">
            <span />
            <span>or</span>
            <span />
          </div>

          <p className={styles.legal}>
            By continuing, you agree to let Bother Me Not read the GitHub activity needed to filter your
            notifications.{" "}
            <a href={`${REPO_URL}#readme`} target="_blank" rel="noopener">
              Learn more
            </a>
          </p>

          <div className={styles.secure}>
            <span>Secure OAuth connection</span>
            <span aria-hidden="true" className={styles.secureGlyph}>⌁</span>
          </div>
        </section>
      </main>

      <MetaFooter right="Only the signal reaches you." className={styles.footer} />
    </div>
  );
}
