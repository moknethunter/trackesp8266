// MokTrak Service Worker — يعمل بدون إنترنت
const CACHE = 'moktrak-v3';
const CORE = ['./', './index.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // HTML → شبكة مع fallback للكاش
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // مكتبات + أوزان الموديل → كاش أولًا
  const cacheable =
    url.includes('jsdelivr') ||
    url.includes('storage.googleapis') ||
    url.includes('tfhub') ||
    url.includes('tfjs-models') ||
    url.endsWith('.bin') ||
    url.endsWith('.json') ||
    url.endsWith('.js');

  if (cacheable) {
    e.respondWith(
      caches.match(e.request).then(hit => {
        if (hit) return hit;
        return fetch(e.request).then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        }).catch(() => caches.match(e.request));
      })
    );
    return;
  }

  // الباقي
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
