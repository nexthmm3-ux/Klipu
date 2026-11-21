/* Klipu service worker: keeps the app page and icons so it opens like an app, even offline.
   Speech models are cached by the page itself the first time they are used. */
const CACHE = 'klipu-v4';
const SHELL = ['./', './index.html', './app.html', './login.html', './reviews.html', './faq.html', './site.css', './site.js', './app.js', './home.js', './faq-data.js', './controls.js', './admin.html', './klipu-config.js', './logo.png', './mark.png', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;       // only our own files
  e.respondWith(
    fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then((m) => m || caches.match('./index.html')))
  );
});
