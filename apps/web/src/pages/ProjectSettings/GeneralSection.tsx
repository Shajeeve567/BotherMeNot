import { updateProjectSchema } from "@bother-me-not/contracts";
import { useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { controlClass, Field } from "../../components/ui/Field";
import { Notice } from "../../components/ui/Notice";
import { Panel } from "../../components/ui/Panel";
import { describeError } from "../../lib/api";
import type { Project } from "../../lib/projects";
import { useUpdateProject } from "../../lib/queries";
import { serverFieldErrors, validate, type FieldErrors } from "../../lib/validate";
import styles from "./Settings.module.css";

const AI_CONTEXT_MAX = 2000;

export function GeneralSection({ project }: { project: Project }) {
  const update = useUpdateProject(project.id);
  const [name, setName] = useState(project.name);
  const [aiContext, setAiContext] = useState(project.aiContext ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});

  const dirty = name.trim() !== project.name || aiContext !== (project.aiContext ?? "");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // An empty aiContext is sent as "" on purpose: that's how the API clears it.
    const checked = validate(updateProjectSchema, { name: name.trim(), aiContext });
    if ("errors" in checked) return setErrors(checked.errors);

    setErrors({});
    update.mutate(checked.data, {
      onSuccess: (saved) => setName(saved.name),
      onError: (err) => setErrors(serverFieldErrors(err)),
    });
  };

  const formError = update.isError && Object.keys(errors).length === 0 ? describeError(update.error) : null;

  return (
    <Panel
      eyebrow="GENERAL"
      title="Name and AI context"
      description="The AI context is added to every evaluation for this project. Tell it what you work on and what counts as urgent."
    >
      <form onSubmit={onSubmit} noValidate className={styles.form}>
        <Field label="Project name" error={errors.name}>
          {(control) => (
            <input
              {...control}
              className={controlClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoComplete="off"
            />
          )}
        </Field>

        <Field
          label="AI context"
          count={{ value: aiContext.length, max: AI_CONTEXT_MAX }}
          error={errors.aiContext}
          hint="Optional. Clear it to rely on the default judgement."
        >
          {(control) => (
            <textarea
              {...control}
              className={controlClass}
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value)}
              placeholder="e.g. I own the billing service. Failed CI on main and review requests from my team are urgent; dependabot and docs changes are not."
            />
          )}
        </Field>

        {formError && <Notice tone="error">{formError}</Notice>}

        <div className={styles.actions}>
          {update.isSuccess && !dirty && (
            <span role="status" className={styles.saved}>
              Saved
            </span>
          )}
          <Button type="submit" disabled={!dirty} pending={update.isPending} pendingLabel="Saving…">
            Save changes
          </Button>
        </div>
      </form>
    </Panel>
  );
}
