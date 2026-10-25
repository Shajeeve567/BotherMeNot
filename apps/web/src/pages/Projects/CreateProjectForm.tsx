import { createProjectSchema } from "@bother-me-not/contracts";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/Button";
import { controlClass, Field } from "../../components/ui/Field";
import { Notice } from "../../components/ui/Notice";
import { describeError } from "../../lib/api";
import { useCreateProject } from "../../lib/queries";
import { serverFieldErrors, validate, type FieldErrors } from "../../lib/validate";
import styles from "./ProjectsPage.module.css";

/** Name only: AI context and GitHub are set up on the settings page this lands on. */
export function CreateProjectForm() {
  const navigate = useNavigate();
  const create = useCreateProject();
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Trim here: the shared schema allows a whitespace-only name.
    const checked = validate(createProjectSchema, { name: name.trim() });
    if ("errors" in checked) return setErrors(checked.errors);

    setErrors({});
    create.mutate(checked.data, {
      onSuccess: (project) => navigate(`/dashboard/projects/${project.id}?created=1`),
      onError: (err) => setErrors(serverFieldErrors(err)),
    });
  };

  const formError = create.isError && Object.keys(errors).length === 0 ? describeError(create.error) : null;

  return (
    <form onSubmit={onSubmit} noValidate className={styles.createForm}>
      <div className={styles.createRow}>
        <Field label="Project name" error={errors.name}>
          {(control) => (
            <input
              {...control}
              className={controlClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. acme-api"
              maxLength={100}
              autoComplete="off"
            />
          )}
        </Field>
        <Button type="submit" pending={create.isPending} pendingLabel="Creating…" className={styles.createButton}>
          Create project
        </Button>
      </div>
      {formError && <Notice tone="error">{formError}</Notice>}
    </form>
  );
}
