function initUtils(G) {

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

    G.poblarSelectorMaterias = function(selectElement, placeholderHTML, disabledOptionIfEmpty = false) {
        if (!selectElement) return;
        selectElement.innerHTML = placeholderHTML;

        let datos = [];
        try {
            const raw = localStorage.getItem('aseac-malla-datos');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) datos = parsed;
            }
        } catch(e) { datos = []; }

        if (datos.length === 0) {
            document.querySelectorAll('.tarjeta-materia').forEach(t => {
                const id = t.id || '';
                const nombre = t.querySelector('.nombre-materia')?.innerText?.trim() || id;
                const columna = t.closest('.columna-nivel');
                const nivel = columna?.querySelector('h3')?.innerText?.trim() || 'General';
                if (id) datos.push({ id, nombre, nivel });
            });
        }

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

        const tieneNivelCompleto = datos.some(m => isNaN(parseInt(m.nivel)));
        const tipoPeriodo = tieneNivelCompleto
            ? ''
            : (localStorage.getItem('aseac-malla-periodo') || 'Semestre');

        const grupos = {};
        datos.forEach(m => {
            const lv = (m.nivel || 'General').toString();
            if (!grupos[lv]) grupos[lv] = [];
            grupos[lv].push(m);
        });

        const nivelesOrdenados = Object.keys(grupos).sort((a, b) => {
            const na = parseInt(a), nb = parseInt(b);
            return (isNaN(na) || isNaN(nb)) ? a.localeCompare(b) : na - nb;
        });

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
