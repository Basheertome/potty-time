const CACHE_NAME = "potty-time-v22";
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
  "./audio/wipe-fx.mp3",
  "./audio/flush-fx.mp3",
  "./audio/potty-wait.mp3",
  "./audio/voice-potty.mp3",
  "./audio/voice-wipe.mp3",
  "./audio/voice-pantsup.mp3",
  "./audio/voice-flush.mp3",
  "./audio/voice-washhands.mp3",
  "./audio/voice-complete.mp3",
  "./audio/goodjob-fx.mp3",
  "./images/bg-pond.png",
  "./images/pond-button.png",
  "./images/pond-button-reflection.png",
  "./images/bubble.png",
  "./images/butterfly.png",
  "./images/frog-still.png",
  "./images/frog-blink-strip.png",
  "./images/frog-ribbit-strip.png",
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
