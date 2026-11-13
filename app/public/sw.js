const CACHE = "tabat-v1";
const STATIC = (p) => p.startsWith("/_next/static/") || p.startsWith("/geo/") || p === "/icon.svg";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  if (STATIC(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); }
            return res;
          }),
      ),
    );
  } else if (req.mode === "navigate" && url.pathname.startsWith("/lapangan")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); }
          return res;
        })
        .catch(() => caches.match(req)),
    );
  }
});
