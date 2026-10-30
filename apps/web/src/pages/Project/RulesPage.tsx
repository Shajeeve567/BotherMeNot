import { Panel } from "../../components/ui/Panel";
import { useCurrentProject } from "./ProjectLayout";

/** Draft placeholder: per-project rules arrive with the rules backend. */
export function RulesPage() {
  const project = useCurrentProject();

  return (
    <>
      <title>{`${project.name} rules · Bother Me Not`}</title>

      <Panel
        eyebrow="DRAFT"
        title="Rules"
        description="Add simple rules that run before the AI, such as ignoring bot authors or always delivering failing checks. Until then, the AI context decides what is worth an alert."
      />
    </>
  );
}
