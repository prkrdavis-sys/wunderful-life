import { StorageError } from "./types";

function parseVersionHeader(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.trim().replaceAll('"', "");
  const version = Number(normalized);
  if (!Number.isSafeInteger(version) || version < 1) return null;
  return version;
}

export function expectedSiteVersion(request: Request): number {
  // Prefer X-Site-Version. Vercel can intercept If-Match against response ETags
  // and return a platform 412 before our route handler runs.
  const version =
    parseVersionHeader(request.headers.get("x-site-version")) ??
    parseVersionHeader(request.headers.get("if-match"));

  if (version === null) {
    throw new StorageError(
      "A current site content version is required for this change.",
      428,
    );
  }
  return version;
}
