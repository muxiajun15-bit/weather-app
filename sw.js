const CACHE_NAME = "weather-pwa-v3";
const ASSETS = [
  "./weather.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./bg1.jpg",
  "./bg2.jpg",
  "./bg3.jpg",
  "./bg4.jpg",
  "./icon-192.png",
  "./icon-512.png"
];

const API_CACHE   = "weather-api-v3";
const API_TTL_MS  = 60 * 60 * 1000; // 1 hour

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME && k !== API_CACHE) return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Cache OpenWeatherMap API responses for 1 hour
  if (url.hostname === "api.openweathermap.org") {
    event.respondWith(apiCacheFirst(event.request));
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

async function apiCacheFirst(request) {
  const cache    = await caches.open(API_CACHE);
  const cached   = await cache.match(request);

  if (cached) {
    const dateHeader = cached.headers.get("sw-cached-at");
    if (dateHeader && Date.now() - parseInt(dateHeader, 10) < API_TTL_MS) {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and annotate with cache timestamp
      const headers = new Headers(response.headers);
      headers.set("sw-cached-at", String(Date.now()));
      const annotated = new Response(await response.clone().arrayBuffer(), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
      cache.put(request, annotated);
    }
    return response;
  } catch {
    // Offline: return stale cache if available
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }
}
