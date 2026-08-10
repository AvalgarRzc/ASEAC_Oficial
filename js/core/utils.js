// ********************************************************************
// *  utils.js — Utilidades Varias (Core)                             *
// *                                                                  *
// *  Propósito: Proveer funciones de ayuda generales como generación *
// *  de colores para las materias.                                   *
// ********************************************************************

function initUtils(G) {
    // G.obtenerColorPorSigla(sigla)
    // Color de línea para una materia. REDISEÑO: ahora lee en vivo la
    // variable CSS --color-disponible (la misma que actualiza el
    // selector de temas 🎨 vía theme.js) en lugar de un array estático,
    // así las flechas quedan sincronizadas con el tema elegido. Si por
    // algún motivo la variable no está disponible, cae de vuelta al
    // array G.coloresNeon como antes.
    G.obtenerColorPorSigla = function(sigla) {
        const cssVar = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-disponible').trim();
        if (cssVar) return cssVar;

        let hash = 0;
        for (let i = 0; i < sigla.length; i++) {
            hash = sigla.charCodeAt(i) + ((hash << 5) - hash);
        }
        return G.coloresNeon[Math.abs(hash) % G.coloresNeon.length];
    };

    // G.poblarSelectorMaterias(selectElement, placeholderHTML, disabledOptionIfEmpty)
    // Puebla de forma dinámica y ordenada un elemento <select> con las materias de la malla.
    G.poblarSelectorMaterias = function(selectElement, placeholderHTML, disabledOptionIfEmpty = false) {
        if (!selectElement) return;
        selectElement.innerHTML = placeholderHTML;

        // 1. Intentar obtener de la malla dinámica en localStorage
        let datos = [];
        try {
            const raw = localStorage.getItem('aseac-malla-datos');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) datos = parsed;
            }
        } catch(e) { datos = []; }

        // 2. Si no hay datos dinámicos, usar tarjetas estáticas del DOM (fallback)
        if (datos.length === 0) {
            document.querySelectorAll('.tarjeta-materia').forEach(t => {
                const id = t.id || '';
                const nombre = t.querySelector('.nombre-materia')?.innerText?.trim() || id;
                const columna = t.closest('.columna-nivel');
                const nivel = columna?.querySelector('h3')?.innerText?.trim() || 'General';
                if (id) datos.push({ id, nombre, nivel });
            });
        }

        // 3. Validar si está vacío
        if (datos.length === 0) {
            if (disabledOptionIfEmpty) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.disabled = true;
                opt.textContent = '⚠ No hay malla cargada';
                selectElement.appendChild(opt);
            }
            return;
        }

        // 4. Determinar prefijo del tipo de periodo
        const tieneNivelCompleto = datos.some(m => isNaN(parseInt(m.nivel)));
        const tipoPeriodo = tieneNivelCompleto
            ? ''
            : (localStorage.getItem('aseac-malla-periodo') || 'Semestre');

        // 5. Agrupar materias por nivel
        const grupos = {};
        datos.forEach(m => {
            const lv = (m.nivel || 'General').toString();
            if (!grupos[lv]) grupos[lv] = [];
            grupos[lv].push(m);
        });

        // 6. Ordenar niveles
        const nivelesOrdenados = Object.keys(grupos).sort((a, b) => {
            const na = parseInt(a), nb = parseInt(b);
            return (isNaN(na) || isNaN(nb)) ? a.localeCompare(b) : na - nb;
        });

        // 7. Insertar elementos en el dropdown
        nivelesOrdenados.forEach(nivel => {
            const grp = document.createElement('optgroup');
            grp.label = tipoPeriodo ? `${tipoPeriodo} ${nivel}` : nivel;
            grupos[nivel].forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = `${m.id} — ${m.nombre}`;
                grp.appendChild(opt);
            });
            selectElement.appendChild(grp);
        });
    };
}
