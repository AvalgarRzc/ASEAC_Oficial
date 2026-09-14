const CACHE_NAME = 'aseac-v1';

const ARCHIVOS = [
    './',
    './index.html',
    './manifest.json',
    './avalgar.ico',
    './logo avrzc web.png',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable.png',
    './apple-touch-icon.png',
    './css/variables.css',
    './css/base.css',
    './css/layout.css',
    './css/malla.css',
    './css/horario.css',
    './css/tareas.css',
    './css/estudio.css',
    './css/apuntes.css',
    './css/mobile/mobile-app.css',
    './css/mobile/mobile-navbar.css',
    './css/mobile/mobile-malla.css',
    './js/app.js',
    './js/core/utils.js',
    './js/core/db.js',
    './js/core/backup.js',
    './js/core/restaurar.js',
    './js/core/storage.js',
    './js/core/theme.js',
    './js/core/panel-lateral.js',
    './js/core/pwa-install.js',
    './js/modules/malla.js',
    './js/modules/horario.js',
    './js/modules/modales.js',
    './js/modules/tareas.js',
    './js/modules/estudio.js',
    './js/modules/apuntes.js',
    './js/mobile/mobile-malla.js',
    './js/mobile/mobile-navbar.js',
    './js/mobile/mobile-init.js',
    'https://cdn.jsdelivr.net/npm/leader-line-new@1.1.9/leader-line.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.allSettled(ARCHIVOS.map(url => cache.add(url).catch(() => {})))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    e.respondWith(
        fetch(e.request)
            .then(networkResp => {
                if (networkResp.status === 200) {
                    const clone = networkResp.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return networkResp;
            })
            .catch(() => {
                return caches.match(e.request).then(cachedResp => {
                    if (cachedResp) return cachedResp;
                    if (e.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

self.addEventListener('message', e => {
    if (e.data?.tipo === 'PROGRAMAR_NOTIF') {
        const { titulo, cuerpo, delay } = e.data;
        setTimeout(() => {
            self.registration.showNotification(titulo, {
                body: cuerpo,
                icon: './icon-192.png',
                badge: './icon-192.png',
                tag: titulo,
                renotify: true,
                vibrate: [200, 100, 200],
                actions: [
                    { action: 'abrir', title: 'Abrir ASEAC' },
                    { action: 'cerrar', title: 'Cerrar' }
                ]
            });
        }, delay || 0);
    }
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    if (e.action === 'cerrar') return;
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const c of list) {
                if ('focus' in c) return c.focus();
            }
            if (clients.openWindow) return clients.openWindow('./index.html');
        })
    );
});
