/**
 * PostgREST returns PGRST303 when the JWT `iat` is ahead of the server's clock.
 * On hosted Supabase, the API gateway mints a short-lived internal JWT for each
 * REST request (even when the client sends an opaque sb_secret_ key or a legacy
 * service-role JWT). Intermittent clock skew between the gateway and PostgREST
 * causes sporadic 401s with this code — not a bad key or client misconfiguration.
 *
 * Retry with backoff gives clocks time to align. Each attempt should use a fresh
 * HTTP request (and therefore a newly minted gateway JWT).
 */

const JWT_CLOCK_SKEW_BACKOFF_MS = [250, 500, 1_000, 2_000, 4_000] as const;
const MAX_JWT_CLOCK_SKEW_ATTEMPTS = JWT_CLOCK_SKEW_BACKOFF_MS.length + 1;

function isJwtClockSkewMessage(message: string): boolean {
  return (
    message.includes("JWT issued at future") || message.includes("PGRST303")
  );
}

export function isJwtClockSkewError(error: unknown): boolean {
  if (!error) return false;

  if (typeof error === "string") {
    return isJwtClockSkewMessage(error);
  }

  if (error instanceof Error) {
    if (isJwtClockSkewMessage(error.message)) return true;
    if ("cause" in error && error.cause) {
      return isJwtClockSkewError(error.cause);
    }
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const code = typeof record.code === "string" ? record.code : "";
    const message = typeof record.message === "string" ? record.message : "";
    if (code === "PGRST303" || isJwtClockSkewMessage(message)) return true;
    if ("cause" in record && record.cause) {
      return isJwtClockSkewError(record.cause);
    }
  }

  return false;
}

function jwtClockSkewDelayMs(attempt: number): number {
  const base =
    JWT_CLOCK_SKEW_BACKOFF_MS[attempt] ??
    JWT_CLOCK_SKEW_BACKOFF_MS[JWT_CLOCK_SKEW_BACKOFF_MS.length - 1];
  // Spread parallel ISR revalidations so they do not retry in lockstep.
  const jitter = Math.floor(Math.random() * 100);
  return base + jitter;
}

export async function withSupabaseJwtClockSkewRetry<T>(
  run: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_JWT_CLOCK_SKEW_ATTEMPTS; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      const canRetry =
        isJwtClockSkewError(error) && attempt < MAX_JWT_CLOCK_SKEW_ATTEMPTS - 1;
      if (!canRetry) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, jwtClockSkewDelayMs(attempt)),
      );
    }
  }

  throw lastError;
}
