document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('contenedor-malla');
    const nivelesBox = document.getElementById('niveles-body');
    const futurasBox = document.getElementById('futuras-body');
    if (!contenedor || !nivelesBox || !futurasBox) return;

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

    function sincronizarLineas() {
        if (!window.G || !Array.isArray(window.G.lineasConexion)) return;

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
            } catch (e) {  }
        });
    }

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

        for (let anio = 1; anio <= maxAnio; anio++) {
            const btn = document.createElement('button');
            btn.className = 'nivel-item';
            btn.type = 'button';
            btn.title = `Año ${anio} (semestre ${(anio - 1) * SEMESTRES_POR_ANIO + 1}–${anio * SEMESTRES_POR_ANIO})`;
            btn.textContent = `${anio}°`;
            btn.addEventListener('click', () => {
                aplicarFiltroAnio(anio, columnas);
                marcarActivo(btn);

                contenedor.scrollTo({ left: 0, behavior: 'smooth' });

                const columnasDelAnio = columnas.filter(c => c.style.display !== 'none');
                setTimeout(() => dibujarAbanico(btn, columnasDelAnio), 350);
            });
            nivelesBox.appendChild(btn);
        }
    }

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

    const observer = new MutationObserver((mutaciones) => {
        const huboCambioRelevante = mutaciones.some(m =>
            m.type === 'childList' || (m.type === 'attributes' && m.attributeName === 'class')
        );
        if (huboCambioRelevante) renderTodo();
    });
    observer.observe(contenedor, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
});
