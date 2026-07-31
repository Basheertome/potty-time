const CACHE_NAME = "potty-time-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./audio/handwash-song.mp3",
  "./images/bg-pond.png",
  "./images/pond-button.png",
  "./images/pond-button-reflection.png",
  "./images/frog-croak-0.png",
  "./images/frog-croak-1.png",
  "./images/frog-croak-2.png",
  "./images/frog-croak-3.png",
  "./images/frog-jump-0.png",
  "./images/frog-jump-1.png",
  "./images/frog-jump-2.png",
  "./images/frog-jump-3.png",
  "./images/frog-jump-4.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
