// Bumped by ./bump-version.sh, which keeps this in sync with the ?v=
// query strings in index.html and in APP_SHELL below. They must match
// exactly: the page asks for "style.css?v=<APP_VERSION>", and that
// full URL including the query is the cache key, so a mismatch means
// every request misses the cache and the app stops working offline.
const APP_VERSION = "42";
const CACHE_NAME = `potty-time-v${APP_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  `./style.css?v=${APP_VERSION}`,
  `./script.js?v=${APP_VERSION}`,
  "./manifest.webmanifest",
  "./fonts/patrick-hand.woff2",
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
  "./images/emoji/toilet.svg",
  "./images/emoji/roll-of-paper.svg",
  "./images/emoji/briefs.svg",
  "./images/emoji/cyclone.svg",
  "./images/emoji/bubbles.svg",
  "./images/emoji/frog.svg",
  "./images/emoji/party-popper.svg",
  "./images/emoji/confetti-ball.svg",
  "./images/emoji/rainbow.svg",
  "./images/emoji/sparkles.svg",
  "./images/emoji/star.svg",
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

// index.html is fetched network-first so a new deploy is picked up on
// the very next load: it's the one file whose URL never changes, and
// it's what points at the current ?v= of the CSS and JS. Everything
// else is cache-first, which is safe precisely because the things that
// change carry a version in their URL - a bump makes them a cache miss
// automatically, and the art and audio never change at all.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isPage =
    request.mode === "navigate" || url.pathname.endsWith("/index.html");

  event.respondWith(isPage ? pageNetworkFirst(request) : cacheFirst(request));
});

async function pageNetworkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    // no-store keeps the HTTP cache out of the loop entirely - without
    // it a "network" fetch can still be answered from a stale disk
    // cache entry, which is the exact staleness we're trying to avoid.
    const fresh = await fetch(request, { cache: "no-store" });
    if (fresh && fresh.ok) cache.put("./index.html", fresh.clone());
    return fresh;
  } catch (err) {
    // Offline: fall back to the last good copy so the app still opens.
    const cached =
      (await cache.match(request)) || (await cache.match("./index.html"));
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
