/* Wunderful Life — installable PWA service worker (offline fallback only). */
const CACHE_NAME = "wunderful-life-shell-v4";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function offlineResponse() {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(OFFLINE_URL);
  if (cached) return cached;

  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline</title></head><body><p>You’re offline.</p><button onclick="location.reload()">Reload</button></body></html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.mode !== "navigate") return;

  event.respondWith(fetch(request).catch(() => offlineResponse()));
});
