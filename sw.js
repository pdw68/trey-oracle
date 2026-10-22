// TREY Solo Dashboard service worker.
// Network-first: when online you always get the newest version from GitHub
// (the page itself is always re-checked with the server, skipping the browser's
// 10-minute cache); when offline it falls back to the last copy it saved.
// Your campaigns live in the browser's storage, not here, so this never touches them.
const CACHE = 'trey-v17';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png',
  'alegreya-400-italic.woff2', 'alegreya-400-normal.woff2', 'alegreya-500-normal.woff2', 'alegreya-700-italic.woff2', 'alegreya-700-normal.woff2', 'alegreya-sans-400-italic.woff2', 'alegreya-sans-400-normal.woff2', 'alegreya-sans-500-normal.woff2', 'alegreya-sans-700-normal.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.searchParams.has('vcheck')) return;
  const nav = req.mode === 'navigate';
  const net = nav ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req);
  e.respondWith(
    net.then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(nav ? req.url : req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(hit => hit || (nav ? caches.match('index.html') : undefined)))
  );
});
