import { Blob } from "../../components/Blob";
import { Grain } from "../../components/Grain";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Integrations } from "./Integrations";
import { Nav } from "./Nav";
import styles from "./Landing.module.css";

export function Landing() {
  return (
    <div className={styles.frame} id="top">
      <title>Bother Me Not · See what’s important</title>
      <Grain />
      <Blob className={styles.deco} size={380} color="var(--green-900)" opacity={0.55} position={{ left: -140, top: 720 }} />
      <Blob className={styles.deco} size={460} color="var(--green-600)" opacity={0.6} position={{ right: -180, top: 1480 }} />
      <span aria-hidden="true" className={`${styles.deco} ${styles.ring}`} />
      <Blob className={styles.deco} size={28} color="var(--white)" opacity={0.85} position={{ left: 70, top: 2240 }} />

      <Nav />
      <Hero />
      <HowItWorks />
      <Integrations />
      <Footer />
    </div>
  );
}
