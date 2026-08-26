import type { ContentStoreSource } from "@/lib/storage/runtime";

export function siteResponseHeaders(
  version: number,
  extras?: { updatedAt?: string; store?: ContentStoreSource },
): HeadersInit {
  return {
    "Cache-Control": "no-store, max-age=0",
    // Prefer X-Site-Version for clients. Avoid relying on ETag/If-Match for
    // writes: Vercel can evaluate If-Match at the edge and return 412.
    "X-Site-Version": String(version),
    ...(extras?.updatedAt ? { "X-Site-Updated-At": extras.updatedAt } : {}),
    ...(extras?.store ? { "X-Content-Store": extras.store } : {}),
  };
}

export function siteUpdatedAtFromResponse(response: Response): string | null {
  return response.headers.get("x-site-updated-at");
}

export function siteVersionFromResponse(response: Response): number {
  const version = Number(response.headers.get("x-site-version"));
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("The server did not confirm the saved site version.");
  }
  return version;
}
