export function siteResponseHeaders(version: number): HeadersInit {
  return {
    "Cache-Control": "no-store, max-age=0",
    ETag: `"${version}"`,
    "X-Site-Version": String(version),
  };
}
