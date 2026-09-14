const DB_NAME       = 'AseacDB';
const DB_VERSION    = 1;
const STORE_APUNTES = 'apuntes';

window.DB = {

    abrir: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_APUNTES)) {

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

    guardar: async function(apunte) {
        const db = await this.abrir();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_APUNTES], 'readwrite');
            const store       = transaction.objectStore(STORE_APUNTES);

            if (!apunte.id) apunte.id = Date.now();

            const request = store.put(apunte);
            request.onsuccess = () => resolve(apunte);
            request.onerror   = (e) => reject(e.target.error);
        });
    },

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
