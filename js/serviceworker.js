const CACHE = 'pos-cache-v1';
const FILES = [
  '/index.html','/inventory.html','/sales.html','/admin.html',
  '/css/main.css',
  '/js/database.js','/js/app.js','/js/inventory.js','/js/sales.js','/js/admin.js','/js/costing.js'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
