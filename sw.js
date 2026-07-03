// ********************************************************************
// *  sw.js — Service Worker (v9)                                     *
// *                                                                  *
// *  Propósito: Habilitar el funcionamiento Offline de la PWA.       *
// *  Instala y cachea los archivos estáticos listados en ARCHIVOS.   *
// *  Intercepta peticiones de red y sirve desde caché si es posible. *
// *  Ademas, programa notificaciones web locales mediante mensajes.  *
// ********************************************************************
const CACHE_NAME = 'aseac-v9';

const ARCHIVOS = [
    './',
    './index.html',
    './manifest.json',
    './avalgar.ico',
    './css/variables.css',
    './css/base.css',
    './css/layout.css',
    './css/malla.css',
    './css/horario.css',
    './css/tareas.css',
    './css/estudio.css',
    './js/app.js',
    './js/modules/ia.js',
    './js/core/utils.js',
    './js/core/storage.js',
    './js/core/restaurar.js',
    './js/core/theme.js',
    './js/modules/malla.js',
    './js/modules/horario.js',
    './js/modules/modales.js',
    './js/modules/tareas.js',
    './js/modules/estudio.js',
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
    e.respondWith(
        caches.match(e.request).then(resp => resp || fetch(e.request))
    );
});

self.addEventListener('message', e => {
    if (e.data?.tipo === 'PROGRAMAR_NOTIF') {
        const { titulo, cuerpo, delay } = e.data;
        setTimeout(() => {
            self.registration.showNotification(titulo, {
                body: cuerpo,
                icon: './avalgar.ico',
                badge: './avalgar.ico',
                tag: titulo,
                renotify: true,
                vibrate: [200, 100, 200],
                actions: [
                    { action: 'abrir', title: 'Ver horario' },
                    { action: 'cerrar', title: 'Cerrar' }
                ]
            });
        }, delay);
    }
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    if (e.action === 'cerrar') return;
    e.waitUntil(
        clients.matchAll({ type: 'window' }).then(list => {
            for (const c of list) {
                if (c.url.includes('index.html') && 'focus' in c) return c.focus();
            }
            if (clients.openWindow) return clients.openWindow('./index.html');
        })
    );
});
