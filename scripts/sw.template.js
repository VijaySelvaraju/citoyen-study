const CACHE = 'citoyen-__VERSION__';
const ASSETS = __ASSETS__;
self.addEventListener('install', event => {
  // Revalidate assets so an update cannot repack an older HTTP cache entry.
  const requests = ASSETS.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(requests)));
});
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('citoyen-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('message', event => { if(event.data === 'ACTIVATE_UPDATE') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).catch(error => {
    if(event.request.mode === 'navigate') return caches.match(new URL('./', self.registration.scope));
    throw error;
  })));
});
