// ============================================================
// panel-lateral.js — REDISEÑO: selector de niveles + materias futuras
// ------------------------------------------------------------
// Archivo NUEVO, aislado. No modifica malla.js ni ningún otro
// archivo existente. Solo LEE el DOM/estado que malla.js ya
// calcula (clases .disponible/.aprobada/.bloqueada y la
// estructura .columna-nivel > h3) y lo refleja en dos paneles:
//   #niveles → botones para saltar a cada columna de la malla.
//   #futuras → materias .disponible (prerrequisitos cumplidos,
//              aún no aprobadas) agrupadas por nivel — es decir,
//              "lo próximo que puedes cursar según lo aprobado".
// Se re-sincroniza automáticamente con un MutationObserver sobre
// #contenedor-malla, así que funciona igual con la malla estática
// de ejemplo, una malla importada, o al aprobar/desaprobar materias.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('contenedor-malla');
    const nivelesBox = document.getElementById('niveles-body');
    const futurasBox = document.getElementById('futuras-body');
    if (!contenedor || !nivelesBox || !futurasBox) return;

    // ── 1. SELECTOR DE NIVELES, AGRUPADO POR AÑO ──────────────
    // Cada "año" agrupa 2 semestres (año 1 → sem 1-2, año 2 → sem 3-4,
    // etc.). Al elegir un año, se OCULTAN las columnas de los demás
    // años (display:none), no solo se hace scroll — así "no se ve
    // todo ahí", tal como pediste. Un botón "Todos" restaura la vista
    // completa. Es puramente de presentación: nunca toca clases de
    // estado (.disponible/.aprobada/.bloqueada) ni el DOM interno de
    // cada tarjeta, solo la propiedad display de la columna completa.
    const SEMESTRES_POR_ANIO = 2;

    function numeroSemestre(columna) {
        const h3 = columna.querySelector('h3');
        const n = h3 ? parseInt(h3.innerText.match(/\d+/)?.[0]) : NaN;
        return isNaN(n) ? null : n;
    }

    function aplicarFiltroAnio(anio, columnas) {
        columnas.forEach(columna => {
            const sem = numeroSemestre(columna);
            const perteneceAlAnio = anio === null || sem === null ||
                Math.ceil(sem / SEMESTRES_POR_ANIO) === anio;
            columna.style.display = perteneceAlAnio ? '' : 'none';
        });
        sincronizarLineas();
    }

    // Evita las flechas "huérfanas" que quedaban apuntando al vacío
    // cuando una columna se oculta con display:none: LeaderLine no se
    // entera solo, así que acá se le avisa a mano. Usa window.G
    // (expuesto por app.js) para leer G.lineasConexion sin duplicar
    // la lógica de dibujado que ya vive en malla.js.
    function sincronizarLineas() {
        if (!window.G || !Array.isArray(window.G.lineasConexion)) return;
        // Doble rAF: espera a que el navegador recalcule el layout
        // después del cambio de display antes de reposicionar.
        requestAnimationFrame(() => requestAnimationFrame(() => {
            window.G.lineasConexion.forEach(c => {
                const origenEl = document.getElementById(c.origenId);
                const destinoEl = document.getElementById(c.destinoId);
                const oculto = (el) => !el || el.closest('.columna-nivel')?.style.display === 'none';
                if (!c.linea) return;
                if (oculto(origenEl) || oculto(destinoEl)) {
                    c.linea.hide('none');
                } else {
                    c.linea.show('none');
                    c.linea.position();
                }
            });
        }));
    }

    // ── 1.1 ABANICO DE LÍNEAS DEL NIVEL ACTIVO ─────────────────
    // Dibuja flechas (reutilizando LeaderLine, ya cargado para las
    // líneas de prerrequisito de malla.js) desde el botón de año
    // activo hacia cada materia visible en ese año — el efecto
    // "en abanico" pedido. Solo se dibuja con un año específico
    // seleccionado (con "Todos" no, sería ilegible con 57 materias).
    let lineasAbanico = [];
    function limpiarAbanico() {
        lineasAbanico.forEach(l => { try { l.remove(); } catch (e) {} });
        lineasAbanico = [];
    }
    function dibujarAbanico(btnOrigen, columnasVisibles) {
        limpiarAbanico();
        if (!btnOrigen || typeof LeaderLine === 'undefined' || columnasVisibles.length === 0) return;
        const color = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-disponible').trim() || '#c9a24b';
        // Solo la PRIMERA columna del año (las materias "raíz", sin
        // prerrequisito previo dentro del filtro) recibe el abanico
        // desde el botón de nivel. El resto de columnas ya tiene su
        // propia línea de tiempo (las flechas de prerrequisito que
        // dibuja malla.js), así que no hace falta duplicarlas.
        const primeraColumna = columnasVisibles[0];
        primeraColumna.querySelectorAll('.tarjeta-materia').forEach(tarjeta => {
            try {
                const linea = new LeaderLine(btnOrigen, tarjeta, {
                    color,
                    size: 1.2,
                    path: 'fluid',
                    startSocket: 'right',
                    endSocket: 'left',
                    startPlug: 'disc',
                    startPlugSize: 2,
                    endPlug: 'behind',
                    dash: { animation: false },
                });
                lineasAbanico.push(linea);
            } catch (e) { /* tarjeta fuera de pantalla, se ignora */ }
        });
    }
    // El abanico usa coordenadas de pantalla: hay que reposicionarlo
    // si se hace scroll horizontal dentro de la malla.
    contenedor.addEventListener('scroll', () => {
        lineasAbanico.forEach(l => { try { l.position(); } catch (e) {} });
    });
    function renderNiveles() {
        limpiarAbanico();
        nivelesBox.innerHTML = '';
        const columnas = Array.from(contenedor.querySelectorAll('.columna-nivel'));
        if (columnas.length === 0) return;

        const semestres = columnas.map(numeroSemestre).filter(n => n !== null);
        const maxAnio = semestres.length ? Math.ceil(Math.max(...semestres) / SEMESTRES_POR_ANIO) : 1;

        const marcarActivo = (btn) => {
            nivelesBox.querySelectorAll('.nivel-item.activo').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
        };

        // Botón "Todos" — quita el filtro
        const btnTodos = document.createElement('button');
        btnTodos.className = 'nivel-item nivel-item--todos activo';
        btnTodos.type = 'button';
        btnTodos.title = 'Ver todos los años';
        btnTodos.textContent = 'Todos';
        btnTodos.addEventListener('click', () => {
            aplicarFiltroAnio(null, columnas);
            marcarActivo(btnTodos);
            limpiarAbanico();
        });
        nivelesBox.appendChild(btnTodos);

        // Un botón por año
        for (let anio = 1; anio <= maxAnio; anio++) {
            const btn = document.createElement('button');
            btn.className = 'nivel-item';
            btn.type = 'button';
            btn.title = `Año ${anio} (semestre ${(anio - 1) * SEMESTRES_POR_ANIO + 1}–${anio * SEMESTRES_POR_ANIO})`;
            btn.textContent = `${anio}°`;
            btn.addEventListener('click', () => {
                aplicarFiltroAnio(anio, columnas);
                marcarActivo(btn);
                // Lleva la vista al inicio de la malla filtrada
                contenedor.scrollTo({ left: 0, behavior: 'smooth' });
                // Dibuja el abanico después de que el scroll/reflow
                // termine, para que las líneas midan bien las tarjetas.
                const columnasDelAnio = columnas.filter(c => c.style.display !== 'none');
                setTimeout(() => dibujarAbanico(btn, columnasDelAnio), 350);
            });
            nivelesBox.appendChild(btn);
        }
    }

    // ── 2. MATERIAS FUTURAS ────────────────────────────────────
    // Toma las tarjetas .disponible (prerrequisitos ya cumplidos,
    // todavía no marcadas como aprobadas) y las agrupa por el
    // nivel/semestre de su columna, tal como pide el boceto.
    function renderFuturas() {
        futurasBox.innerHTML = '';
        const disponibles = contenedor.querySelectorAll('.tarjeta-materia.disponible');

        if (disponibles.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'futuras-vacio';
            vacio.textContent = 'No hay materias disponibles todavía.';
            futurasBox.appendChild(vacio);
            return;
        }

        const grupos = {};
        disponibles.forEach(tarjeta => {
            const columna = tarjeta.closest('.columna-nivel');
            const h3 = columna?.querySelector('h3');
            const etiqueta = h3 ? h3.innerText.trim() : 'General';
            (grupos[etiqueta] = grupos[etiqueta] || []).push(tarjeta);
        });

        Object.keys(grupos).forEach(etiqueta => {
            const bloque = document.createElement('div');
            bloque.className = 'futura-sem';

            const label = document.createElement('div');
            label.className = 'futura-sem-label';
            label.textContent = etiqueta;
            bloque.appendChild(label);

            grupos[etiqueta].forEach(tarjeta => {
                const sigla = tarjeta.querySelector('.encabezado-materia')?.innerText?.trim() || tarjeta.id;
                const chip = document.createElement('div');
                chip.className = 'futura-chip';
                chip.textContent = sigla;
                // Clic en el chip resalta la tarjeta real en la malla
                chip.addEventListener('click', () => {
                    tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                    tarjeta.style.outline = '1px solid var(--ct-acento, #c9a24b)';
                    setTimeout(() => tarjeta.style.outline = '', 1200);
                });
                bloque.appendChild(chip);
            });

            futurasBox.appendChild(bloque);
        });
    }

    function renderTodo() {
        renderNiveles();
        renderFuturas();
    }

    renderTodo();

    // Re-sincroniza cuando: se aprueba/desaprueba una materia (cambia
    // su class), o cuando la malla entera se reemplaza (import/reset).
    const observer = new MutationObserver((mutaciones) => {
        const huboCambioRelevante = mutaciones.some(m =>
            m.type === 'childList' || (m.type === 'attributes' && m.attributeName === 'class')
        );
        if (huboCambioRelevante) renderTodo();
    });
    observer.observe(contenedor, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
});
