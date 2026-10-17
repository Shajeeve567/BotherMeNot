import { upsertAiConfigSchema, type AiProvider } from "@bother-me-not/contracts";
import { KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { ConfirmButton } from "../../components/ui/ConfirmButton";
import { controlClass, Field } from "../../components/ui/Field";
import { Notice } from "../../components/ui/Notice";
import { Panel } from "../../components/ui/Panel";
import { Skeleton } from "../../components/ui/Skeleton";
import { describeError } from "../../lib/api";
import { PROVIDERS, providerLabel, type AiConfig } from "../../lib/aiConfig";
import { formatDate } from "../../lib/format";
import { useAiConfig, useRemoveAiConfig, useSaveAiConfig } from "../../lib/queries";
import { serverFieldErrors, validate, type FieldErrors } from "../../lib/validate";
import styles from "./Settings.module.css";

const DESCRIPTION =
  "By default, events are judged by the server's model. Bring your own key to use a specific provider and model for this project.";

export function AiModelSection({ projectId }: { projectId: string }) {
  const query = useAiConfig(projectId);

  return (
    <Panel eyebrow="AI MODEL" title="Model and API key" description={DESCRIPTION}>
      {query.isPending ? (
        <Skeleton label="AI model loading" />
      ) : query.isError ? (
        <Notice tone="error">{describeError(query.error)}</Notice>
      ) : (
        // Remount when the saved config changes, so the form re-reads it as its starting values.
        <AiModelForm key={query.data?.updatedAt ?? "default"} projectId={projectId} saved={query.data} />
      )}
    </Panel>
  );
}

function AiModelForm({ projectId, saved }: { projectId: string; saved: AiConfig | null }) {
  const save = useSaveAiConfig(projectId);
  const remove = useRemoveAiConfig(projectId);

  const [provider, setProvider] = useState<AiProvider | "">(saved?.provider ?? "");
  const [model, setModel] = useState(saved?.model ?? "");
  const [apiKey, setApiKey] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  // The stored key belongs to the stored provider: a new key is needed the first time, or on a switch.
  const keyRequired = !saved || provider !== saved.provider;
  const dirty = !saved || provider !== saved.provider || model.trim() !== saved.model || apiKey !== "";
  const example = PROVIDERS.find((p) => p.id === provider)?.modelExample;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    const checked = validate(upsertAiConfigSchema, {
      provider: provider || undefined,
      model,
      // Omitted (not "") when blank, which tells the API to keep the stored key.
      apiKey: apiKey.trim() || undefined,
    });
    const found = "errors" in checked ? { ...checked.errors } : {};
    if (provider === "") found.provider = "Choose a provider.";

    // Same two rules the API enforces, checked here so the message lands on the key field.
    if (keyRequired && !apiKey.trim() && !found.apiKey) {
      found.apiKey = saved
        ? `Switching to ${providerLabel(provider)} needs that provider's API key.`
        : "An API key is required the first time a model is configured.";
    }

    if (Object.keys(found).length > 0 || "errors" in checked) return setErrors(found);

    setErrors({});
    save.mutate(checked.data, {
      // Success remounts this form (new updatedAt), which also clears the key field.
      onError: (err) => setErrors(serverFieldErrors(err)),
    });
  };

  const failed = save.isError ? save.error : remove.isError ? remove.error : null;
  const formError = failed && Object.keys(errors).length === 0 ? describeError(failed) : null;

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <div className={styles.status}>
        {saved ? (
          <>
            <KeyRound size={18} strokeWidth={2.4} aria-hidden="true" />
            <span>
              <strong>{providerLabel(saved.provider)}</strong> · <code>{saved.model}</code> · key{" "}
              <code aria-label={`ending in ${saved.keyHint}`}>••••{saved.keyHint}</code>
              <span className={styles.statusMeta}> · updated {formatDate(saved.updatedAt)}</span>
            </span>
          </>
        ) : (
          <span>Using the default model.</span>
        )}
      </div>

      <div className={styles.twoCol}>
        <Field label="Provider" error={errors.provider}>
          {(control) => (
            <select
              {...control}
              className={controlClass}
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProvider | "")}
            >
              <option value="" disabled>
                Choose a provider
              </option>
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Model"
          error={errors.model}
          hint="Model ids aren't checked until an event is evaluated, so copy it exactly from your provider."
        >
          {(control) => (
            <input
              {...control}
              className={controlClass}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={example ? `e.g. ${example}` : "Model id"}
              maxLength={100}
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </Field>
      </div>

      <Field
        label="API key"
        error={errors.apiKey}
        hint={
          keyRequired
            ? "Stored encrypted and never shown again. Only the last 4 characters are kept for reference."
            : `Leave blank to keep the saved key ending in ${saved?.keyHint}.`
        }
      >
        {(control) => (
          <input
            {...control}
            type="password"
            className={controlClass}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={keyRequired ? "Paste your API key" : `••••${saved?.keyHint}`}
            maxLength={500}
            // Not a login password: keep browsers and password managers from saving it.
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            spellCheck={false}
          />
        )}
      </Field>

      {formError && <Notice tone="error">{formError}</Notice>}

      <div className={styles.actions}>
        {saved && (
          <ConfirmButton
            variant="secondary"
            confirmLabel="Confirm: use default"
            pending={remove.isPending}
            pendingLabel="Removing…"
            onConfirm={() => remove.mutate()}
          >
            Use default model
          </ConfirmButton>
        )}
        <Button type="submit" disabled={!dirty} pending={save.isPending} pendingLabel="Saving…">
          {saved ? "Save changes" : "Save model"}
        </Button>
      </div>
    </form>
  );
}
