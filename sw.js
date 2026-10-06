// Service worker di Tool TV: la pagina funziona anche senza rete, dopo la
// prima apertura. Prima la rete, poi la copia salvata — con la rete si vede
// sempre l'ultima versione pubblicata, senza si vede l'ultima vista. Se la rete
// e' lenta, dopo 4 secondi si serve la copia invece di lasciare lo schermo
// bianco. Scritto da scripts/pubblica_tool.py di claude-hub: non modificarlo
// nel repository pubblico, la pubblicazione successiva lo sovrascrive.
var CACHE = "tool-tv-web-20261007";
var FILE = ["./", "index.html", "manifest.webmanifest",
            "icona-180.png", "icona-192.png", "icona-512.png"];

function conTempo(p, ms) {
  return new Promise(function (ok, ko) {
    var t = setTimeout(function () { ko(new Error("rete lenta")); }, ms);
    p.then(function (r) { clearTimeout(t); ok(r); }, function (e) { clearTimeout(t); ko(e); });
  });
}
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILE); })
    .then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (n) {
    return Promise.all(n.filter(function (x) { return x !== CACHE; })
                        .map(function (x) { return caches.delete(x); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(function (salvata) {
    var rete = fetch(e.request).then(function (r) {
      if (r && r.ok) { var c = r.clone(); caches.open(CACHE).then(function (k) { k.put(e.request, c); }); }
      return r;
    });
    rete["catch"](function () {});
    if (!salvata) return rete;
    return conTempo(rete, 4000)["catch"](function () { return salvata; });
  }));
});
