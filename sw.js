// Zenkai Media offline helper.
// Keeps a copy of the app itself so it opens without internet. Your library lives in your browser
// already; lists, searches and pictures still need the internet. Never stores anything from /api.
const CACHE = "zenkai-v9";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  // The page: always try for the newest version first, so updates show straight away
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname === "/") {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  if (SHELL.some(p => url.pathname.endsWith(p.replace("./", "/")))) e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
