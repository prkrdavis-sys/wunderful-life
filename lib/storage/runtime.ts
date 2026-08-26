export type ContentStoreSource = "database" | "local-file";

/** True on Vercel builds and serverless. Local `next dev` is false. */
export function isHostedProduction(): boolean {
  return process.env.VERCEL === "1";
}

export function describeUnknownError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const extra = [
      "code" in error && typeof error.code === "string" ? error.code : null,
      "details" in error && typeof error.details === "string"
        ? error.details
        : null,
    ].filter((value): value is string => Boolean(value));
    const base = error.message || fallback;
    return extra.length ? `${base} (${extra.join("; ")})` : base;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = ["message", "code", "details", "hint"]
      .map((key) => record[key])
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    if (parts.length) return parts.join(" — ");
  }

  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}
