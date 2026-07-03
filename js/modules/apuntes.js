// ********************************************************************
// *  js/modules/apuntes.js — Gestor de Apuntes                      *
// *                                                                  *
// *  Propósito: Bloc de notas interactivo con soporte de imágenes.   *
// *  Guarda apuntes en IndexedDB vía window.DB (expuesto por db.js). *
// *  Se integra con la malla activa para el dropdown de materias.    *
// *                                                                  *
// *  FIX v1.1: Se eliminó el import ES Module de db.js.             *
// *  Ahora sigue el patrón initX(G) del resto de módulos:           *
// *    · Se carga como script clásico (sin type="module").           *
// *    · Usa window.DB en lugar de import { DB }.                    *
// *    · Recibe G para integración futura con el namespace global.   *
// *                                                                  *
// *  Para modificar estilos → css/apuntes.css                        *
// *  Depende de: db.js (window.DB), window.escapeHTML               *
// ********************************************************************

function initApuntes(G) {
    // Referencia a la DB global expuesta por db.js
    const DB = window.DB;

    // ── Elementos UI ─────────────────────────────────────────────────
    const btnAbrir  = document.getElementById('btn-abrir-apuntes');
    const btnCerrar = document.getElementById('btn-cerrar-apuntes');
    const modal     = document.getElementById('modal-apuntes');

    const panelLista       = document.getElementById('apuntes-lista');
    const panelEditor      = document.getElementById('apuntes-editor-panel');
    const panelPlaceholder = document.getElementById('apuntes-placeholder');
    const btnNuevo         = document.getElementById('btn-nuevo-apunte');

    const inputTitulo  = document.getElementById('apunte-titulo');
    const selectMateria = document.getElementById('apunte-materia');
    const inputText    = document.getElementById('apunte-texto');
    const btnGuardar   = document.getElementById('btn-guardar-apunte');
    const btnBorrar    = document.getElementById('btn-borrar-apunte');

    const inputArchivos = document.getElementById('input-subir-imagen');
    const apunteGaleria = document.getElementById('apunte-galeria');
    const countImagenes = document.getElementById('count-imagenes');

    // ── Estado interno ────────────────────────────────────────────────
    let apunteActual   = null;
    let apuntesCargados = [];

    // ── Apertura / cierre del modal ───────────────────────────────────
    if (btnAbrir) {
        btnAbrir.addEventListener('click', async () => {
            modal.style.display = 'flex';
            await cargarMateriaDropdown();
            await cargarListaApuntes();
        });
    }
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            modal.style.display = 'none';
            apunteActual = null;
            limpiarEditor();
            panelEditor.style.display      = 'none';
            panelPlaceholder.style.display = 'flex';
        });
    }

    // *******************************************************************
    // CASCADE MATERIA — sincronizado con la malla activa de ASEAC
    // Prioridad:
    //   1. localStorage['aseac-malla-datos'] → malla dinámica guardada
    //   2. Fallback: tarjetas .tarjeta-materia del DOM (malla estática)
    // Agrupa por semestre/periodo usando <optgroup>
    // *******************************************************************
    async function cargarMateriaDropdown() {
        // Resetear: solo queda la opción "General"
        selectMateria.innerHTML = '<option value="">General (Sin Materia)</option>';

        // ** FUENTE 1: Malla dinámica guardada en localStorage *********
        let datos = [];
        try {
            const raw = localStorage.getItem('aseac-malla-datos');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    datos = parsed; // formato: [{id, nombre, nivel, prerrequisitos}]
                }
            }
        } catch(e) { datos = []; }

        // ** FUENTE 2: Tarjetas estáticas del DOM (fallback) ***********
        if (datos.length === 0) {
            document.querySelectorAll('.tarjeta-materia').forEach(tarjeta => {
                const id     = tarjeta.id || '';
                const nombre = tarjeta.querySelector('.nombre-materia')?.innerText?.trim() || id;
                // El nivel viene del h3 de la columna: "1er Semestre", "Semestre 1", etc.
                const columna = tarjeta.closest('.columna-nivel');
                const nivel   = columna?.querySelector('h3')?.innerText?.trim() || 'General';
                if (id) datos.push({ id, nombre, nivel });
            });
        }

        // Si no hay nada, se queda solo con "General (Sin Materia)"
        if (datos.length === 0) return;

        // ── Etiqueta del tipo de periodo (Semestre / Año / etc.) ────────
        // Para malla dinámica: localStorage['aseac-malla-periodo']
        // Para malla estática: el h3 ya tiene el texto completo, no se prefija
        const tieneNivelCompleto = datos.some(m => isNaN(parseInt(m.nivel)));
        const tipoPeriodo = tieneNivelCompleto
            ? ''  // el nivel ya incluye "Semestre X", no duplicar
            : (localStorage.getItem('aseac-malla-periodo') || 'Semestre');

        // ── Agrupar por nivel ─────────────────────────────────────────
        const grupos = {};
        datos.forEach(m => {
            const lv = m.nivel || 'General';
            if (!grupos[lv]) grupos[lv] = [];
            grupos[lv].push(m);
        });

        // ── Ordenar niveles (numérico si es posible, alfabético si no) ─
        const nivelesOrdenados = Object.keys(grupos).sort((a, b) => {
            const na = parseInt(a), nb = parseInt(b);
            return (isNaN(na) || isNaN(nb)) ? a.localeCompare(b) : na - nb;
        });

        // ── Insertar optgroups y opciones ─────────────────────────────
        nivelesOrdenados.forEach(nivel => {
            const grp = document.createElement('optgroup');
            grp.label = tipoPeriodo ? `${tipoPeriodo} ${nivel}` : nivel;
            grupos[nivel].forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = `${m.id} — ${m.nombre}`;
                grp.appendChild(opt);
            });
            selectMateria.appendChild(grp);
        });
    }

    // ── Cargar apuntes desde IndexedDB ───────────────────────────────
    async function cargarListaApuntes() {
        try {
            apuntesCargados = await DB.obtenerTodos();
            renderizarLista();
        } catch (e) {
            console.error('ASEAC Apuntes: Error al cargar apuntes locales:', e);
        }
    }

    function renderizarLista() {
        panelLista.innerHTML = '';
        if (apuntesCargados.length === 0) {
            panelLista.innerHTML = `<div class="apunte-vacio-msg" style="text-align:center; color: var(--texto-secundario); margin-top:20px; font-size: 0.9em; opacity: 0.5;">Aún no hay apuntes.</div>`;
            return;
        }

        apuntesCargados.forEach(ap => {
            const el = document.createElement('div');
            el.className = 'apunte-item';
            if (apunteActual && apunteActual.id === ap.id) {
                el.classList.add('activo');
            }

            const dateStr    = new Date(ap.id).toLocaleDateString();
            const matOverlay = ap.materia ? `<b>${window.escapeHTML(ap.materia)}</b>` : 'General';

            // Vista previa corta
            let txt     = ap.texto || '';
            let preview = txt.substring(0, 40);
            if (txt.length > 40) preview += '...';
            if (!preview) preview = '<i>Sin texto</i>';

            el.innerHTML = `
                <h4>${window.escapeHTML(ap.titulo) || 'Apunte Sin Título'}</h4>
                <p>${window.escapeHTML(preview)}</p>
                <div class="apunte-meta">
                    <span>${matOverlay}</span>
                    <span>${window.escapeHTML(dateStr)}</span>
                </div>
            `;

            el.addEventListener('click', () => abrirApunte(ap));
            panelLista.appendChild(el);
        });
    }

    // ── Lógica de Edición ─────────────────────────────────────────────

    btnNuevo.addEventListener('click', () => {
        apunteActual = {
            id: Date.now(),
            titulo: '',
            materia: '',
            texto: '',
            imagenes: [] // array de Files o Blobs
        };
        renderizarEditor();
        renderizarLista();
    });

    function abrirApunte(apunte) {
        apunteActual = apunte;
        if (!apunteActual.imagenes) apunteActual.imagenes = [];
        renderizarEditor();
        renderizarLista();
    }

    function renderizarEditor() {
        panelPlaceholder.style.display = 'none';
        panelEditor.style.display      = 'flex';

        inputTitulo.value   = apunteActual.titulo  || '';
        selectMateria.value = apunteActual.materia || '';
        inputText.value     = apunteActual.texto   || '';

        renderizarGaleria();
    }

    function limpiarEditor() {
        inputTitulo.value   = '';
        selectMateria.value = '';
        inputText.value     = '';
        apunteGaleria.innerHTML   = '';
        countImagenes.textContent = '0';
    }

    // ── Guardar ───────────────────────────────────────────────────────
    btnGuardar.addEventListener('click', async () => {
        if (!apunteActual) return;

        apunteActual.titulo  = inputTitulo.value.trim();
        apunteActual.materia = selectMateria.value;
        apunteActual.texto   = inputText.value;

        btnGuardar.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
        try {
            await DB.guardar(apunteActual);
            await cargarListaApuntes();

            btnGuardar.innerHTML = `<i class="fas fa-check"></i> OK`;
            setTimeout(() => {
                btnGuardar.innerHTML = `<i class="fas fa-save"></i> Guardar`;
            }, 1500);
        } catch (e) {
            alert('Error guardando el apunte interno.');
            btnGuardar.innerHTML = `<i class="fas fa-save"></i> Guardar`;
            console.error(e);
        }
    });

    // ── Borrar ────────────────────────────────────────────────────────
    btnBorrar.addEventListener('click', async () => {
        if (!apunteActual || !apunteActual.id) return;
        if (!confirm('¿Seguro que deseas eliminar este apunte de forma permanente?')) return;

        try {
            await DB.eliminar(apunteActual.id);
            apunteActual = null;
            limpiarEditor();
            panelEditor.style.display      = 'none';
            panelPlaceholder.style.display = 'flex';
            await cargarListaApuntes();
        } catch (e) {
            console.error(e);
        }
    });

    // ── Imágenes ──────────────────────────────────────────────────────
    inputArchivos.addEventListener('change', (e) => {
        if (!apunteActual) return;
        const files = e.target.files;
        if (files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            apunteActual.imagenes.push(files[i]);
        }

        // reset input para permitir cargar el mismo archivo de nuevo
        e.target.value = '';
        renderizarGaleria();
    });

    function renderizarGaleria() {
        apunteGaleria.innerHTML = '';

        if (!apunteActual || !apunteActual.imagenes) {
            countImagenes.textContent = '0';
            return;
        }

        countImagenes.textContent = apunteActual.imagenes.length;

        apunteActual.imagenes.forEach((imgBlob, index) => {
            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'img-thumb-container';

            const urlObj = URL.createObjectURL(imgBlob);

            const imgEl = document.createElement('img');
            imgEl.className = 'img-thumb';
            imgEl.src   = urlObj;
            imgEl.title = 'Clic para agrandar';

            // Lightbox para ver más grande
            imgEl.addEventListener('click', () => abrirLightbox(urlObj));

            // Borrar imagen
            // Nota: no se borra de IndexedDB hasta que hagan clic en "Guardar"
            const btnDel = document.createElement('button');
            btnDel.className = 'btn-eliminar-img';
            btnDel.innerHTML = '<i class="fas fa-times"></i>';
            btnDel.addEventListener('click', (e) => {
                e.stopPropagation(); // no activar el lightbox
                apunteActual.imagenes.splice(index, 1);
                renderizarGaleria();
            });

            thumbDiv.appendChild(imgEl);
            thumbDiv.appendChild(btnDel);
            apunteGaleria.appendChild(thumbDiv);
        });
    }

    // ── Lightbox simple ───────────────────────────────────────────────
    function abrirLightbox(imgSrc) {
        const overlay = document.createElement('div');
        overlay.id = 'lightbox-img-overlay';

        const imgBig = document.createElement('img');
        imgBig.src = imgSrc;

        overlay.appendChild(imgBig);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    }
}
