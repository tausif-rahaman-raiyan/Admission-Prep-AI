const VERSION = 'admission-prep-v1';
const scopeUrl = new URL(self.registration.scope);
const shellUrl = new URL('./', scopeUrl).toString();
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(VERSION); await cache.add(shellUrl); await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith('admission-prep-') && key !== VERSION).map(key => caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const request = event.request; const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.includes('/data/')) event.respondWith((async () => {
    const cache = await caches.open(VERSION); const cached = await cache.match(request); if (cached) return cached;
    try { const response = await fetch(request); if (response.ok) await cache.put(request, response.clone()); return response; }
    catch { return new Response('Question data is not available offline yet.', { status: 503 }); }
  })());
  else if (request.mode === 'navigate') event.respondWith(fetch(request).catch(async () => (await caches.match(shellUrl)) || Response.error()));
});
