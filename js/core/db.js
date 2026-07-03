// ********************************************************************
// *  db.js — Gestión de IndexedDB (Core)                             *
// *                                                                  *
// *  Propósito: Proveer una interfaz asíncrona para guardar notas e  *
// *  imágenes. Evita los límites de espacio de localStorage.         *
// *                                                                  *
// *   Al cargarse como   *
// *  script clásico (sin type="module"), el "export" en nivel        *
// *  superior lanza SyntaxError y window.DB nunca se asigna.        *
// *  Ahora DB se expone solo en window.DB (accesible globalmente     *
// *  por backup.js, apuntes.js y cualquier otro módulo que lo use).  *
// *                                                                  *
// *  ORDEN DE CARGA: debe ir antes de backup.js y apuntes.js        *
// *  en index.html para que window.DB esté disponible.              *
// ********************************************************************

const DB_NAME       = 'AseacDB';
const DB_VERSION    = 1;
const STORE_APUNTES = 'apuntes';

/**
 * Módulo para interactuar con IndexedDB usando Promesas.
 * Soporta almacenamiento de texto e imágenes (Blobs).
 * Disponible globalmente como window.DB.
 */
window.DB = {

    // Inicializar y abrir la DB
    abrir: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_APUNTES)) {
                    // id como llave primaria (timestamp al crear)
                    db.createObjectStore(STORE_APUNTES, { keyPath: 'id' });
                }
            };

            request.onsuccess = (e) => resolve(e.target.result);

            request.onerror = (e) => {
                console.error('ASEAC DB: IndexedDB error:', e.target.error);
                reject(e.target.error);
            };
        });
    },

    // Obtener todos los apuntes ordenados por fecha descendente
    // (asume que el id es un timestamp — más nuevo = id más alto)
    obtenerTodos: async function() {
        const db = await this.abrir();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_APUNTES], 'readonly');
            const store       = transaction.objectStore(STORE_APUNTES);
            const request     = store.getAll();

            request.onsuccess = () => {
                const resultados = request.result.sort((a, b) => b.id - a.id);
                resolve(resultados);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    // Guardar o actualizar un apunte (put = insert or replace)
    guardar: async function(apunte) {
        const db = await this.abrir();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_APUNTES], 'readwrite');
            const store       = transaction.objectStore(STORE_APUNTES);

            // Asignar id si es nuevo
            if (!apunte.id) apunte.id = Date.now();

            const request = store.put(apunte);
            request.onsuccess = () => resolve(apunte);
            request.onerror   = (e) => reject(e.target.error);
        });
    },

    // Eliminar un apunte por su id
    eliminar: async function(id) {
        const db = await this.abrir();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_APUNTES], 'readwrite');
            const store       = transaction.objectStore(STORE_APUNTES);
            const request     = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror   = (e) => reject(e.target.error);
        });
    }
};
