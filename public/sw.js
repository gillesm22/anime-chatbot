const CACHE_NAME = "anime-chatbot-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API calls: network first, fall back to cached offline response
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline: return cached response or generate offline message
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // For chat API: return a generic offline response
            if (url.pathname === "/api/chat") {
              const offlineResponse = JSON.stringify({
                type: "text",
                content: "I'm offline right now, but I'll be here when you're back online!"
              });
              return new Response(
                `data: {"type":"expression","expression":"sad"}\n\ndata: {"type":"text","content":"I can't connect right now... but I'm still here with you. We can talk again when you're back online!"}\n\ndata: {"type":"done"}\n\n`,
                { headers: { "Content-Type": "text/event-stream" } }
              );
            }
            return new Response("Offline", { status: 503 });
          });
        })
    );
    return;
  }

  // Sprites/backgrounds: cache first (they never change)
  if (url.pathname.startsWith("/sprites/") || url.pathname.startsWith("/backgrounds/") || url.pathname.startsWith("/icons/")) {
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

  // Everything else: network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || new Response("Offline", { status: 503 })))
  );
});
