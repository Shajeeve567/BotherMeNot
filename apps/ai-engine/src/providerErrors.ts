// The AI SDK marks client errors (bad key, unknown model, bad request) as not retryable
// and rate limits / server errors as retryable, so one flag works across providers.
// Google answers an invalid key with HTTP 400, so a status-code list would miss it.
export function isPermanentProviderError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { name?: unknown; isRetryable?: unknown };
  return e.name === "AI_APICallError" && e.isRetryable === false;
}

// Fixed messages on purpose: provider error text can echo part of the API key.
export function describeProviderFailure(err: unknown): string {
  const status = (err as { statusCode?: unknown } | null)?.statusCode;
  if (status === 404) return "Model not found for this provider";
  if (status === 400 || status === 401 || status === 403) {
    return "Provider rejected the API key or request";
  }
  return "Provider rejected the request";
}
