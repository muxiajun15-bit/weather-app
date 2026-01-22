const CACHE_NAME = "weather-pwa-v1";
const ASSETS = [
  "./weather.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./bg1.jpg",
  "./bg2.jpg",
  "./bg3.jpg",
  "./bg4.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((c) => c || fetch(event.request)));
});
