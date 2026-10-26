import { useSearchParams } from "react-router";
import { Notice } from "../../components/ui/Notice";
import { useCurrentProject } from "../Project/ProjectLayout";
import { AiModelSection } from "./AiModelSection";
import { DeleteSection } from "./DeleteSection";
import { GeneralSection } from "./GeneralSection";
import { GithubSection } from "./GithubSection";

/** One-shot banners driven by query params (?created=1 after create). */
const ARRIVAL_NOTICES: Record<string, string> = {
  created: "Project created. Next, connect a GitHub repository so its events start flowing in.",
};

/** The project's Settings tab. The surrounding ProjectLayout supplies the header and tabs. */
export function ProjectSettingsPage() {
  const p = useCurrentProject();
  const [params, setParams] = useSearchParams();

  const arrival = Object.keys(ARRIVAL_NOTICES).find((k) => params.has(k));
  const dismissArrival = () =>
    setParams(
      (prev) => {
        Object.keys(ARRIVAL_NOTICES).forEach((k) => prev.delete(k));
        return prev;
      },
      { replace: true },
    );

  return (
    <>
      <title>{`${p.name} settings · Bother Me Not`}</title>

      {arrival && (
        <Notice tone="success" onDismiss={dismissArrival}>
          {ARRIVAL_NOTICES[arrival]}
        </Notice>
      )}

      {/* key: if the route switches to another project, start each form fresh. */}
      <GeneralSection key={`general-${p.id}`} project={p} />
      <GithubSection projectId={p.id} />
      <AiModelSection key={`ai-${p.id}`} projectId={p.id} />
      <DeleteSection project={p} />
    </>
  );
}
