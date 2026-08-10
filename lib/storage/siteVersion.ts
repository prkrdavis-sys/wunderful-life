import { StorageError } from "./types";

export function expectedSiteVersion(request: Request): number {
  const version = Number(request.headers.get("if-match")?.replaceAll('"', ""));
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new StorageError(
      "A current site content version is required for this change.",
      428,
    );
  }
  return version;
}
