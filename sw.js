const CACHE_NAME = 'bragalis-callcenter-v2-8-5';
const APP_SHELL = [
  './',
  './index.html',
  './html/login.html',
  './html/index.html',
  './html/dashboard.html',
  './html/orcamentos.html',
  './html/rotas.html',
  './html/clientes.html',
  './html/contactos.html',
  './html/fornecedores.html',
  './html/users.html',
  './css/styles.css',
  './js/app.js',
  './assets/bragalis-callcenter-icon.png',
  './assets/bragalis-callcenter-bg.png',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Firebase e Google scripts devem tentar rede primeiro.
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // HTML/app: rede primeiro, cache como fallback.
  if (request.mode === 'navigate' || request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('./html/login.html')))
    );
    return;
  }

  // Assets: cache primeiro, atualiza se houver rede.
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
