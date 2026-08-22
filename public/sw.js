/* Wunderful Life — installable PWA service worker (network-first). */
const CACHE_NAME = "wunderful-life-shell-v3";
const OFFLINE_URL = "/offline.html";
const NAV_RETRY_DELAYS_MS = [0, 200, 600];

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
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

async function fetchNavigation(url) {
  return fetch(url, {
    credentials: "same-origin",
    redirect: "follow",
  });
}

async function loadNavigation(event) {
  const preload = await event.preloadResponse;
  if (preload && preload.ok) return preload;

  let lastResponse = preload ?? null;
  for (const [index, delay] of NAV_RETRY_DELAYS_MS.entries()) {
    if (delay) await sleep(delay);
    try {
      const response = await fetchNavigation(event.request.url);
      if (response.ok || !isRetryableStatus(response.status)) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      if (index === NAV_RETRY_DELAYS_MS.length - 1 && lastResponse) {
        return lastResponse;
      }
      if (index === NAV_RETRY_DELAYS_MS.length - 1) {
        throw error;
      }
    }
  }

  if (lastResponse) return lastResponse;
  throw new Error("Navigation request failed.");
}

async function offlineResponse() {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(OFFLINE_URL);
  if (cached) return cached;

  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline</title></head><body><p>You’re offline.</p><button onclick="location.reload()">Reload</button><script>(function(){var k="wl-offline-auto-reload";function r(){try{var l=sessionStorage.getItem(k);if(l&&Date.now()-Number(l)<15000)return;sessionStorage.setItem(k,String(Date.now()))}catch(e){}location.reload()}if(navigator.onLine)r();window.addEventListener("online",r)})()</script></body></html>`,
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

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  // Let the browser stream media with Range requests; intercepting videos
  // delays the hero and can stall on the first frame.
  if (
    request.destination === "video" ||
    request.destination === "audio" ||
    /\.(mp4|m4v|mov|webm|mp3)$/i.test(url.pathname)
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      loadNavigation(event).catch(() => offlineResponse()),
    );
    return;
  }

  event.respondWith(fetch(request));
});
