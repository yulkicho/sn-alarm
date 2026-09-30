// 앱 파일을 폰에 저장해 두고, 인터넷이 없어도 열리게 함.
// 화면(HTML)은 온라인이면 항상 최신본을 받고, 3초 안에 안 오면 저장본으로 열기.
const CACHE = 'snore-alarm-v3';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
    e.waitUntil(net.catch(() => {}));
    if (req.mode !== 'navigate') return hit || net;
    const timeout = new Promise(res => setTimeout(() => res(hit), 3000));
    return Promise.race([net.catch(() => hit), hit ? timeout : net]);
  }));
});
