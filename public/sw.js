// Service worker: deixa o app abrir e funcionar sem internet (no campo, durante o jogo).
// - Casca do app (página, CSS, JS, ícones): rede primeiro, cópia guardada quando não há sinal.
// - Leituras da API (GET /api): rede primeiro; sem sinal, devolve a última resposta guardada com o cabeçalho X-Offline.
// - Alterações (POST/PUT/DELETE) não passam por aqui: o app guarda numa fila e envia quando a conexão volta.
const CACHE = 'caiopina-v4';
const CACHE_API = 'caiopina-api';
const CACHE_FONTES = 'caiopina-fontes';
const CASCA = ['/', '/css/app.css', '/js/app.js', '/manifest.webmanifest', '/logo.png', '/icone-64.png', '/icone-192.png', '/icone-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  const manter = [CACHE, CACHE_API, CACHE_FONTES];
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !manter.includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Marca a resposta guardada para o app saber que está sem internet
async function comoOffline(resposta) {
  const h = new Headers(resposta.headers);
  h.set('X-Offline', '1');
  return new Response(await resposta.blob(), { status: resposta.status, statusText: resposta.statusText, headers: h });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fontes do Google: guarda na primeira vez e usa a cópia depois
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE_FONTES).then((c) => c.match(req).then((r) => r || fetch(req).then((n) => { c.put(req, n.clone()); return n; }))));
    return;
  }
  if (url.origin !== location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(req)
        .then((r) => {
          if (r.ok) {
            const copia = r.clone();
            caches.open(CACHE_API).then((c) => c.put(req, copia));
          }
          return r;
        })
        .catch(() => caches.open(CACHE_API).then((c) => c.match(req, { ignoreVary: true })).then((r) => (r ? comoOffline(r) : Promise.reject(new Error('offline')))))
    );
    return;
  }

  e.respondWith(
    fetch(req)
      .then((r) => {
        if (r.ok) {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return r;
      })
      // CSS e JS vêm com ?v=...: se essa versão não estiver guardada, usa a do mesmo arquivo sem o ?v
      .catch(() => caches.match(req, { ignoreSearch: url.pathname !== '/' }).then((r) => r || caches.match('/')))
  );
});

// Push (quando o pacote webpush estiver instalado no backend)
self.addEventListener('push', (e) => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(d.title || 'Caio Pina', { body: d.body || '', icon: '/icone-192.png', data: d.data || {} }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow('/'))));
});
