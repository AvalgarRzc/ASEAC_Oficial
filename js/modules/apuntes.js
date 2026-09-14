function initApuntes(G) {

    const DB = window.DB;

    const btnAbrir  = document.getElementById('btn-abrir-apuntes');
    const btnCerrar = document.getElementById('btn-cerrar-apuntes');
    const btnVolver = document.getElementById('btn-volver-apuntes');
    const modal     = document.getElementById('modal-apuntes');

    const panelLista       = document.getElementById('apuntes-lista');
    const panelEditor      = document.getElementById('apuntes-editor-panel');
    const panelPlaceholder = document.getElementById('apuntes-placeholder');
    const btnNuevo         = document.getElementById('btn-nuevo-apunte');

    const inputTitulo   = document.getElementById('apunte-titulo');
    const selectMateria  = document.getElementById('apunte-materia');
    const inputCanvas   = document.getElementById('apunte-editor-canvas');
    const inputText     = document.getElementById('apunte-texto');
    const toolbar       = document.getElementById('editor-toolbar');
    const btnResaltar   = document.getElementById('btn-resaltar');
    const btnGuardar    = document.getElementById('btn-guardar-apunte');
    const btnBorrar     = document.getElementById('btn-borrar-apunte');

    const inputArchivos        = document.getElementById('input-subir-imagen');
    const inputArchivosGaleria = document.getElementById('input-subir-imagen-galeria');
    const apunteGaleria        = document.getElementById('apunte-galeria');
    const countImagenes        = document.getElementById('count-imagenes');

    let apunteActual    = null;
    let apuntesCargados = [];

    function cerrarEditorMobile() {
        modal.classList.remove('modo-editor-mobile');
        apunteActual = null;
        limpiarEditor();
        panelEditor.style.display      = 'none';
        panelPlaceholder.style.display = 'flex';
    }

    if (btnAbrir) {
        btnAbrir.addEventListener('click', async () => {
            modal.style.display = 'flex';
            cerrarEditorMobile();
            await cargarMateriaDropdown();
            await cargarListaApuntes();
        });
    }
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            modal.style.display = 'none';
            cerrarEditorMobile();
        });
    }
    if (btnVolver) {
        btnVolver.addEventListener('click', () => {
            cerrarEditorMobile();
        });
    }

    if (toolbar) {
        toolbar.querySelectorAll('.tb-btn[data-cmd]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cmd = btn.dataset.cmd;
                const val = btn.dataset.val || null;
                document.execCommand(cmd, false, val);
                if (inputCanvas) inputCanvas.focus();
            });
        });
    }

    if (btnResaltar) {
        btnResaltar.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('hiliteColor', false, 'rgba(255, 235, 59, 0.45)');
            if (inputCanvas) inputCanvas.focus();
        });
    }

    if (inputCanvas) {
        inputCanvas.addEventListener('paste', (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData)?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const file = items[i].getAsFile();
                    if (file) insertarImagenEnApunte(file);
                }
            }
        });

        inputCanvas.addEventListener('dragover', (e) => e.preventDefault());
        inputCanvas.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                Array.from(e.dataTransfer.files).forEach(file => {
                    if (file.type.startsWith('image/')) {
                        insertarImagenEnApunte(file);
                    }
                });
            }
        });
    }

    async function cargarMateriaDropdown() {
        if (G.poblarSelectorMaterias) {
            G.poblarSelectorMaterias(selectMateria, '<option value="">General (Sin Materia)</option>', false);
        }
    }

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

            let txt      = ap.texto || '';
            let cleanTxt = txt.replace(/<[^>]*>/g, '').trim();
            let preview  = cleanTxt.substring(0, 40);
            if (cleanTxt.length > 40) preview += '...';
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

    btnNuevo.addEventListener('click', () => {
        apunteActual = {
            id: Date.now(),
            titulo: '',
            materia: '',
            texto: '',
            imagenes: []
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
        modal.classList.add('modo-editor-mobile');
        panelPlaceholder.style.display = 'none';
        panelEditor.style.display      = 'flex';

        inputTitulo.value   = apunteActual.titulo  || '';
        selectMateria.value = apunteActual.materia || '';

        let txt = apunteActual.texto || '';

        const tieneTags = /<[a-z][\s\S]*>/i.test(txt);
        if (tieneTags) {
            inputCanvas.innerHTML = txt;
        } else {
            inputCanvas.innerHTML = window.escapeHTML ? window.escapeHTML(txt).replace(/\n/g, '<br>') : txt.replace(/\n/g, '<br>');
        }

        inputCanvas.querySelectorAll('.editor-img-item').forEach(img => {
            img.onclick = () => abrirLightbox(img.src);
        });
        inputCanvas.querySelectorAll('.btn-del-editor-img').forEach(btn => {
            btn.onclick = (ev) => {
                ev.stopPropagation();
                const parent = btn.closest('.editor-img-wrapper');
                if (parent) parent.remove();
            };
        });

        renderizarGaleria();
    }

    function limpiarEditor() {
        inputTitulo.value   = '';
        selectMateria.value = '';
        if (inputCanvas) inputCanvas.innerHTML = '';
        if (inputText)   inputText.value       = '';
        apunteGaleria.innerHTML   = '';
        countImagenes.textContent = '0';
    }

    btnGuardar.addEventListener('click', async () => {
        if (!apunteActual) return;

        apunteActual.titulo  = inputTitulo.value.trim();
        apunteActual.materia = selectMateria.value;
        apunteActual.texto   = inputCanvas.innerHTML;
        if (inputText) inputText.value = inputCanvas.innerText;

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

    btnBorrar.addEventListener('click', async () => {
        if (!apunteActual || !apunteActual.id) return;
        if (!confirm('¿Seguro que deseas eliminar este apunte de forma permanente?')) return;

        try {
            await DB.eliminar(apunteActual.id);
            modal.classList.remove('modo-editor-mobile');
            apunteActual = null;
            limpiarEditor();
            panelEditor.style.display      = 'none';
            panelPlaceholder.style.display = 'flex';
            await cargarListaApuntes();
        } catch (e) {
            console.error(e);
        }
    });

    const manejarArchivosImg = (e) => {
        if (!apunteActual) return;
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            insertarImagenEnApunte(file);
        });

        e.target.value = '';
    };

    if (inputArchivos)        inputArchivos.addEventListener('change', manejarArchivosImg);
    if (inputArchivosGaleria) inputArchivosGaleria.addEventListener('change', manejarArchivosImg);

    function insertarImagenEnApunte(file) {
        if (!apunteActual) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const srcData = e.target.result;

            const wrapper = document.createElement('div');
            wrapper.className = 'editor-img-wrapper';
            wrapper.contentEditable = 'false';

            const img = document.createElement('img');
            img.className = 'editor-img-item';
            img.src   = srcData;
            img.title = 'Clic para agrandar foto';
            img.addEventListener('click', () => abrirLightbox(srcData));

            const btnDel = document.createElement('button');
            btnDel.className = 'btn-del-editor-img';
            btnDel.type = 'button';
            btnDel.innerHTML = '<i class="fas fa-times"></i>';
            btnDel.title = 'Eliminar imagen del apunte';
            btnDel.addEventListener('click', (ev) => {
                ev.stopPropagation();
                wrapper.remove();
            });

            wrapper.appendChild(img);
            wrapper.appendChild(btnDel);

            inputCanvas.focus();
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0 && inputCanvas.contains(sel.anchorNode)) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(wrapper);
                range.collapse(false);
            } else {
                inputCanvas.appendChild(wrapper);
            }

            if (!apunteActual.imagenes) apunteActual.imagenes = [];
            apunteActual.imagenes.push(file);
            renderizarGaleria();
        };

        reader.readAsDataURL(file);
    }

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

            const urlObj = typeof imgBlob === 'string' ? imgBlob : URL.createObjectURL(imgBlob);

            const imgEl = document.createElement('img');
            imgEl.className = 'img-thumb';
            imgEl.src   = urlObj;
            imgEl.title = 'Clic para agrandar foto';

            imgEl.addEventListener('click', () => abrirLightbox(urlObj));

            const btnDel = document.createElement('button');
            btnDel.className = 'btn-eliminar-img';
            btnDel.innerHTML = '<i class="fas fa-times"></i>';
            btnDel.addEventListener('click', (e) => {
                e.stopPropagation();
                apunteActual.imagenes.splice(index, 1);
                renderizarGaleria();
            });

            thumbDiv.appendChild(imgEl);
            thumbDiv.appendChild(btnDel);
            apunteGaleria.appendChild(thumbDiv);
        });
    }

    function abrirLightbox(imgSrc) {
        const overlay = document.createElement('div');
        overlay.id = 'lightbox-img-overlay';

        const imgBig = document.createElement('img');
        imgBig.src = imgSrc;

        overlay.appendChild(imgBig);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        });
    }
}
