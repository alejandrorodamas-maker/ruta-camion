// Copia de la app para abrirla sin cobertura. Mapas, rutas y tráfico van siempre por la red.
const PREFIX = "ruta-camion" + (self.registration.scope.indexOf("/beta/") >= 0 ? "-beta" : "") + "-";
const CACHE = PREFIX + "v3";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./keepawake.mp4",
  "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css", "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  // Solo borra cachés antiguas de esta misma copia (la beta no toca la normal ni al revés)
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.indexOf(PREFIX) === 0 && k !== CACHE && !(PREFIX === "ruta-camion-" && k.indexOf("ruta-camion-beta-") === 0)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.headers.has("range")) return; // el vídeo mudo lo pide por trozos: directo a la red
    e.respondWith(fetch(req, { cache: "no-cache" }).then(res => {
      if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
  } else if (url.hostname === "unpkg.com") {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  }
});
