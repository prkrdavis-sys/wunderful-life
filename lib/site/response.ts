export function siteResponseHeaders(version: number): HeadersInit {
  return {
    "Cache-Control": "no-store, max-age=0",
    // Prefer X-Site-Version for clients. Avoid relying on ETag/If-Match for
    // writes: Vercel can evaluate If-Match at the edge and return 412.
    "X-Site-Version": String(version),
  };
}
