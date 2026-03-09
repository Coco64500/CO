// ═══════════════════════════════════════════════
//  🧭 Course d'Orientation — Service Worker
//  Cache-first pour une utilisation hors ligne
// ═══════════════════════════════════════════════

const CACHE_NAME = 'orientation-v1';

// Ressources à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  './course-orientation.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // CDN — mise en cache au premier chargement
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap',
];

// ── INSTALL : mise en cache des assets locaux ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // On met en cache les fichiers locaux obligatoires
      return cache.addAll([
        './course-orientation.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png',
      ]);
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE : suppression des anciens caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH : stratégie Cache-First avec fallback réseau ──
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Pas en cache → réseau + mise en cache pour plus tard
      return fetch(event.request)
        .then(response => {
          // Ne mettre en cache que les réponses valides
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, toCache);
          });
          return response;
        })
        .catch(() => {
          // Hors ligne et pas en cache → page de secours
          if (event.request.destination === 'document') {
            return caches.match('./course-orientation.html');
          }
        });
    })
  );
});
