var cacheName = 'financial-tracker-1';
var appShellFiles = [
  'bg.jpg',
  'index.html',
  'logo.ico',
  'manifest.json',
  'bootstrap-4.5.0-dist/css/bootstrap-grid.css',
  'bootstrap-4.5.0-dist/css/bootstrap-grid.css.map',
  'bootstrap-4.5.0-dist/css/bootstrap-grid.min.css',
  'bootstrap-4.5.0-dist/css/bootstrap-grid.min.css.map',
  'bootstrap-4.5.0-dist/css/bootstrap-reboot.css',
  'bootstrap-4.5.0-dist/css/bootstrap-reboot.css.map',
  'bootstrap-4.5.0-dist/css/bootstrap-reboot.min.css',
  'bootstrap-4.5.0-dist/css/bootstrap-reboot.min.css.map',
  'bootstrap-4.5.0-dist/css/bootstrap.css',
  'bootstrap-4.5.0-dist/css/bootstrap.css.map',
  'bootstrap-4.5.0-dist/css/bootstrap.min.css',
  'bootstrap-4.5.0-dist/css/bootstrap.min.css.map',
  'bootstrap-4.5.0-dist/js/bootstrap.bundle.js',
  'bootstrap-4.5.0-dist/js/bootstrap.bundle.js.map',
  'bootstrap-4.5.0-dist/js/bootstrap.bundle.min.js',
  'bootstrap-4.5.0-dist/js/bootstrap.bundle.min.js.map',
  'bootstrap-4.5.0-dist/js/bootstrap.js',
  'bootstrap-4.5.0-dist/js/bootstrap.js.map',
  'bootstrap-4.5.0-dist/js/bootstrap.min.js',
  'bootstrap-4.5.0-dist/js/bootstrap.min.js.map',
  'css/index.css',
  'icon/android-icon-144x144.png',
  'icon/android-icon-192x192.png',
  'icon/android-icon-36x36.png',
  'icon/android-icon-48x48.png',
  'icon/android-icon-72x72.png',
  'icon/android-icon-96x96.png',
  'icon/apple-icon-114x114.png',
  'icon/apple-icon-120x120.png',
  'icon/apple-icon-144x144.png',
  'icon/apple-icon-152x152.png',
  'icon/apple-icon-180x180.png',
  'icon/apple-icon-57x57.png',
  'icon/apple-icon-60x60.png',
  'icon/apple-icon-72x72.png',
  'icon/apple-icon-76x76.png',
  'icon/apple-icon-precomposed.png',
  'icon/apple-icon.png',
  'icon/browserconfig.xml',
  'icon/favicon-16x16.png',
  'icon/favicon-32x32.png',
  'icon/favicon-512x512.png',
  'icon/favicon-96x96.png',
  'icon/favicon.ico',
  'icon/ms-icon-144x144.png',
  'icon/ms-icon-150x150.png',
  'icon/ms-icon-310x310.png',
  'icon/ms-icon-70x70.png',
  'js/auth.js',
  'js/balanceSavings.js',
  'js/chart.js',
  'js/entry.js',
  'js/index.js',
  'js/notifications.js',
  'js/sw.js',
  'js/vendor/jquery-3.5.1.min.js',
  'js/vendor/moment.js',
];

self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
    e.waitUntil(
      caches.open(cacheName).then((cache) => {
        console.log('[Service Worker] Caching all: app shell and content');
        return cache.addAll(appShellFiles);
      })
    );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
          console.log('[Service Worker] Fetching resource: '+e.request.url);
      return r || fetch(e.request).then((response) => {
                return caches.open(cacheName).then((cache) => {
          console.log('[Service Worker] Caching new resource: '+e.request.url);
          cache.put(e.request, response.clone());
          return response;
        });
      });
    })
  );
});