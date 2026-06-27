// v5 — self-clearing service worker
// Clears ALL caches on install/activate to prevent stale API responses

const CACHE_NAME = "anime-chatbot-v5";

// Install: skip waiting immediately, clear everything
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.skipWaiting();
});

// Activate: claim all clients, clear any remaining old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network only for API, cache for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API calls: ALWAYS network, never cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          if (url.pathname === "/api/chat") {
            return new Response(
              `data: {"type":"expression","expression":"sad"}\n\ndata: {"type":"text","content":"I can't connect right now... We can talk again when you're back online!"}\n\ndata: {"type":"done"}\n\n`,
              { headers: { "Content-Type": "text/event-stream" } }
            );
          }
          return new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // Sprites/backgrounds: cache first
  if (url.pathname.startsWith("/sprites/") || url.pathname.startsWith("/backgrounds/") || url.pathname.startsWith("/icons/") || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network only (no caching page responses)
  event.respondWith(fetch(event.request));
});
