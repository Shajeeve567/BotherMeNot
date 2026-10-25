import { ApiError } from "./api";

/** Anything with zod's `safeParse`; avoids a direct zod dependency in the web app. */
interface Schema<T> {
  safeParse(input: unknown):
    | { success: true; data: T }
    | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };
}

export type FieldErrors = Record<string, string>;

/**
 * Validates with the same schema the API uses, so the browser shows the server's rules
 * before a round trip. Errors are keyed like the API's `issues[].path`.
 */
export function validate<T>(schema: Schema<T>, input: unknown): { data: T } | { errors: FieldErrors } {
  const result = schema.safeParse(input);
  if (result.success) return { data: result.data };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) errors[issue.path.map(String).join(".")] ??= issue.message;
  return { errors };
}

/** Field errors from a failed mutation, if it was a 400 with `issues`. */
export function serverFieldErrors(err: unknown): FieldErrors {
  return err instanceof ApiError ? err.fieldErrors() : {};
}
