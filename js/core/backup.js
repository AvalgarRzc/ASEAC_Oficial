// ********************************************************************
// *  backup.js — Exportación e Importación de Datos (Core)           *
// *                                                                  *
// *  Propósito: Generar y procesar archivos .json con la copia de    *
// *  seguridad de la DB y del LocalStorage de la aplicación.         *
// *                                                                  *
// *  FIX v1.2: Se eliminó el "export" de BackupManager. Al quitarse  *
// *  type="module" del <script>, un "export" en nivel superior lanza *
// *  SyntaxError y el archivo entero no ejecuta — los botones nunca  *
// *  reciben su listener. Ahora BackupManager vive en window para    *
// *  ser accesible globalmente sin necesitar import.                  *
// *                                                                  *
// *  Depende de: db.js (window.DB debe estar cargado antes)          *
// ********************************************************************

// BackupManager: expuesto en window para ser accesible por cualquier
// script sin necesidad de import. db.js garantiza window.DB antes
// de que DOMContentLoaded llame a las funciones de este objeto.
window.BackupManager = {

    blobToBase64: function(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    base64ToBlob: async function(base64Data) {
        const res = await fetch(base64Data);
        return await res.blob();
    },

    // generarRespaldo(opciones)
    // Construye y descarga un archivo .json con los datos seleccionados.
    // opciones: { malla, horario, tareas, apuntes, notas } (booleans)
    generarRespaldo: async function(opciones) {
        const DB = window.DB;
        const backup = { _version: 1, fecha: Date.now() };

        // Preferencias globales — siempre incluidas
        backup.tema       = localStorage.getItem('aseac-tema');
        backup.horarioTab = localStorage.getItem('aseac-horario-tab');

        if (opciones.malla) {
            backup.malla = {
                datos:    localStorage.getItem('aseac-malla-datos'),
                nombre:   localStorage.getItem('aseac-malla-nombre'),
                periodo:  localStorage.getItem('aseac-malla-periodo'),
                progreso: localStorage.getItem('aseac-progreso')
            };
        }
        if (opciones.horario) backup.horario = localStorage.getItem('aseac-horario');
        if (opciones.tareas)  backup.tareas  = localStorage.getItem('aseac-eventos');
        if (opciones.notas) {
            backup.notasRapidas = localStorage.getItem('aseac-notas');
            backup.iaHistorial  = localStorage.getItem('aseac-ia-historial');
        }
        if (opciones.apuntes) {
            // Leer apuntes de IndexedDB y serializar imágenes (Blob → Base64)
            const apuntesRaw  = await DB.obtenerTodos();
            const apuntesSafe = [];
            for (let ap of apuntesRaw) {
                let imgArr = [];
                if (ap.imagenes) {
                    for (let imgItem of ap.imagenes) {
                        try {
                            const blob = (imgItem instanceof Blob || imgItem instanceof File) ? imgItem : null;
                            if (blob) {
                                const b64 = await this.blobToBase64(blob);
                                imgArr.push({ name: imgItem.name, type: blob.type, data: b64 });
                            }
                        } catch(e) { console.error('ASEAC Backup: error al exportar imagen:', e); }
                    }
                }
                apuntesSafe.push({ ...ap, imagenes: imgArr });
            }
            backup.apuntes = apuntesSafe;
        }

        // Descargar como .json
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup));
        const anchor  = document.createElement('a');
        anchor.href     = dataStr;
        anchor.download = `ASEAC_Backup_${new Date().toLocaleDateString().replace(/\//g,'-')}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    },

    // restaurarRespaldo(jsonData, opciones)
    // Inyecta los datos del .json al localStorage e IndexedDB.
    // opciones: { malla, horario, tareas, apuntes, notas } (booleans)
    restaurarRespaldo: async function(jsonData, opciones) {
        const DB = window.DB;
        let r = 0;

        // Preferencias globales — siempre restauradas si existen en el backup
        if (jsonData.tema !== undefined) {
            if (jsonData.tema) localStorage.setItem('aseac-tema', jsonData.tema);
            else               localStorage.removeItem('aseac-tema');
        }
        if (jsonData.horarioTab !== undefined) {
            if (jsonData.horarioTab) localStorage.setItem('aseac-horario-tab', jsonData.horarioTab);
            else                     localStorage.removeItem('aseac-horario-tab');
        }

        if (opciones.malla && jsonData.malla !== undefined) {
            const m = jsonData.malla;
            if (m.datos   !== undefined) m.datos   ? localStorage.setItem('aseac-malla-datos',   m.datos)   : localStorage.removeItem('aseac-malla-datos');
            if (m.nombre  !== undefined) m.nombre  ? localStorage.setItem('aseac-malla-nombre',  m.nombre)  : localStorage.removeItem('aseac-malla-nombre');
            if (m.periodo !== undefined) m.periodo  ? localStorage.setItem('aseac-malla-periodo', m.periodo) : localStorage.removeItem('aseac-malla-periodo');
            if (m.progreso !== undefined) m.progreso ? localStorage.setItem('aseac-progreso',     m.progreso): localStorage.removeItem('aseac-progreso');
            r++;
        }
        if (opciones.horario && jsonData.horario !== undefined) {
            jsonData.horario ? localStorage.setItem('aseac-horario', jsonData.horario) : localStorage.removeItem('aseac-horario');
            r++;
        }
        if (opciones.tareas && jsonData.tareas !== undefined) {
            jsonData.tareas ? localStorage.setItem('aseac-eventos', jsonData.tareas) : localStorage.removeItem('aseac-eventos');
            r++;
        }
        if (opciones.notas) {
            if (jsonData.notasRapidas !== undefined) {
                jsonData.notasRapidas ? localStorage.setItem('aseac-notas', jsonData.notasRapidas) : localStorage.removeItem('aseac-notas');
            }
            if (jsonData.iaHistorial !== undefined) {
                jsonData.iaHistorial ? localStorage.setItem('aseac-ia-historial', jsonData.iaHistorial) : localStorage.removeItem('aseac-ia-historial');
            }
            r++;
        }
        if (opciones.apuntes && jsonData.apuntes) {
            // Re-ensamblar imágenes (Base64 → File) y guardar en IndexedDB
            for (let ap of jsonData.apuntes) {
                let imgArr = [];
                if (ap.imagenes) {
                    for (let imgData of ap.imagenes) {
                        try {
                            const b    = await this.base64ToBlob(imgData.data);
                            const file = new File([b], imgData.name || 'imagen.jpg', { type: imgData.type || 'image/jpeg' });
                            imgArr.push(file);
                        } catch(e) { console.warn('ASEAC Backup: error re-ensamblando imagen:', e); }
                    }
                }
                await DB.guardar({ ...ap, imagenes: imgArr });
            }
            r++;
        }
        return r;
    }
};

// =============================================
// LÓGICA DE INTERFAZ DE USUARIO (UI)
// =============================================
// DOMContentLoaded garantiza que todos los elementos del DOM y
// window.DB (de db.js) ya están disponibles cuando se ejecuta.
document.addEventListener('DOMContentLoaded', () => {
    const modalExport = document.getElementById('modal-exportar-global');
    const modalImport = document.getElementById('modal-importar-global');

    // ── Abrir modales desde los botones de la navbar ──────────────
    // Se clonan para limpiar cualquier listener previo de modales.js
    // (backup.js es quien controla estos dos botones definitivamente).
    const btnExpOld = document.getElementById('btn-exportar');
    if (btnExpOld) {
        const btnExp = btnExpOld.cloneNode(true);
        btnExpOld.parentNode.replaceChild(btnExp, btnExpOld);
        btnExp.addEventListener('click', () => modalExport.style.display = 'flex');
    }

    const btnImpOld = document.getElementById('btn-importar');
    if (btnImpOld) {
        const btnImp = btnImpOld.cloneNode(true);
        btnImpOld.parentNode.replaceChild(btnImp, btnImpOld);
        btnImp.addEventListener('click', () => {
            modalImport.style.display = 'flex';
            document.getElementById('panel-restauracion-opciones').style.display = 'none';
            document.getElementById('input-archivo-backup').value = '';
        });
    }

    // ── Cerrar modales ────────────────────────────────────────────
    document.getElementById('btn-cerrar-export-global').addEventListener('click', () => modalExport.style.display = 'none');
    document.getElementById('btn-cerrar-import-global').addEventListener('click', () => modalImport.style.display = 'none');

    // ── EXPORTAR: generar y descargar el .json ─────────────────────
    document.getElementById('btn-generar-backup').addEventListener('click', async () => {
        const btn = document.getElementById('btn-generar-backup');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        btn.disabled  = true;

        const opciones = {
            malla:   document.getElementById('chk-exp-malla').checked,
            horario: document.getElementById('chk-exp-horario').checked,
            tareas:  document.getElementById('chk-exp-tareas').checked,
            apuntes: document.getElementById('chk-exp-apuntes').checked,
            notas:   document.getElementById('chk-exp-notas').checked
        };

        try {
            await window.BackupManager.generarRespaldo(opciones);
            modalExport.style.display = 'none';
        } catch(e) {
            console.error('ASEAC Backup: error al exportar:', e);
            alert('Error general al exportar.');
        } finally {
            btn.innerHTML = '<i class="fas fa-download"></i> Descargar Respaldo Archivo ASEAC';
            btn.disabled  = false;
        }
    });

    // ── IMPORTAR: leer el .json y restaurar ───────────────────────
    const zonaDrop  = document.getElementById('zona-drop-backup');
    const inputFile = document.getElementById('input-archivo-backup');
    let archivoJsonParceado = null;

    // Click en la zona de drop → abre el file picker
    zonaDrop.addEventListener('click', () => inputFile.click());

    // Al seleccionar un archivo → parsear y mostrar opciones disponibles
    inputFile.addEventListener('change', (e) => {
        if (e.target.files.length === 0) return;
        const file   = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                archivoJsonParceado = JSON.parse(evt.target.result);

                // Mostrar solo las secciones que contiene el backup
                document.getElementById('panel-restauracion-opciones').style.display = 'block';
                document.getElementById('lbl-imp-malla').style.display    = archivoJsonParceado.malla    ? 'block' : 'none';
                document.getElementById('lbl-imp-horario').style.display  = archivoJsonParceado.horario  ? 'block' : 'none';
                document.getElementById('lbl-imp-tareas').style.display   = archivoJsonParceado.tareas   ? 'block' : 'none';
                document.getElementById('lbl-imp-apuntes').style.display  = archivoJsonParceado.apuntes  ? 'block' : 'none';
                document.getElementById('lbl-imp-notas').style.display    = (archivoJsonParceado.notasRapidas || archivoJsonParceado.iaHistorial) ? 'block' : 'none';
            } catch(e) {
                alert('El archivo no es un Backup válido o está corrupto.');
            }
        };
        reader.readAsText(file);
    });

    // Ejecutar la restauración con las opciones elegidas
    document.getElementById('btn-ejecutar-restauracion').addEventListener('click', async () => {
        if (!archivoJsonParceado) return;
        const btn = document.getElementById('btn-ejecutar-restauracion');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restaurando...';
        btn.disabled  = true;

        const opciones = {
            malla:   document.getElementById('chk-imp-malla').checked,
            horario: document.getElementById('chk-imp-horario').checked,
            tareas:  document.getElementById('chk-imp-tareas').checked,
            apuntes: document.getElementById('chk-imp-apuntes').checked,
            notas:   document.getElementById('chk-imp-notas').checked
        };

        try {
            await window.BackupManager.restaurarRespaldo(archivoJsonParceado, opciones);
            alert('Restauración Completada. La página se reiniciará para aplicar los cambios.');
            window.location.reload();
        } catch(e) {
            console.error('ASEAC Backup: error al restaurar:', e);
            alert('Ocurrió un error parcial durante la restauración.');
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Proceder a Restaurar';
            btn.disabled  = false;
        }
    });
});
