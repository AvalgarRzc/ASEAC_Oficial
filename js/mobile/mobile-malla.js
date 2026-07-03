// ********************************************************************
// *  js/mobile/mobile-malla.js — Vista de Malla para Móvil         *
// *                                                                  *
// *  Propósito: Definir G.renderizarMallaMobile y                   *
// *  G.actualizarMiniProgreso. Solo esta función usa las clases     *
// *  .mobile-accordion-* del CSS mobile/mobile-malla.css.           *
// *                                                                  *
// *  Depende de:                                                     *
// *    · G.lineasConexion   (de malla.js)                           *
// *    · G.actualizarMallaYLineas (de malla.js)                     *
// *    · G.guardarProgreso  (de storage.js)                         *
// *    · window.escapeHTML  (de utils inline en index.html)         *
// *                                                                  *
// *  Para modificar estilos → css/mobile/mobile-malla.css           *
// ********************************************************************

function initMobileMalla(G) {
    if (!G) return;

    // ─────────────────────────────────────────────────────────────────
    // G.actualizarMiniProgreso()
    // Recorre cada grupo de acordeón y actualiza el contador X/Total
    // y el ancho de la barra de progreso del encabezado del año.
    // Se llama automáticamente después de cada click en una tarjeta.
    // ─────────────────────────────────────────────────────────────────
    G.actualizarMiniProgreso = function() {
        document.querySelectorAll('.mobile-accordion-group').forEach(group => {
            const total    = group.querySelectorAll('.tarjeta-materia').length;
            const aprobadas = group.querySelectorAll('.tarjeta-materia.aprobada').length;
            const pct = total === 0 ? 0 : Math.round((aprobadas / total) * 100);

            const counter = group.querySelector('.mob-year-counter');
            const bar     = group.querySelector('.mob-year-bar-fill');
            if (counter) counter.textContent = `${aprobadas}/${total}`;
            if (bar)     bar.style.width = pct + '%';
        });
    };

    // ─────────────────────────────────────────────────────────────────
    // G.renderizarMallaMobile(datosMalla)
    // Recibe el mismo array de materias que renderizarMallaDinamica
    // pero construye acordeones agrupados por Año en lugar de columnas.
    //
    //   · Si la malla es por "Semestre": Año N = Sem (2N-1) + Sem (2N).
    //   · Si la malla es por "Año":      cada nivel es ya un año completo.
    //   · Las tarjetas reutilizan las mismas clases CSS del escritorio
    //     (tarjeta-materia / aprobada / disponible / bloqueada) para
    //     que todo el Core (storage, backup, actualizarMallaYLineas)
    //     funcione sin modificaciones.
    // ─────────────────────────────────────────────────────────────────
    G.renderizarMallaMobile = function(datosMalla) {
        const contenedor = document.getElementById('contenedor-malla');

        // Limpiar flechas de escritorio si quedaron activas
        if (G.lineasConexion) {
            G.lineasConexion.forEach(c => c.linea && c.linea.remove());
            G.lineasConexion.length = 0;
        }

        contenedor.innerHTML = '';

        // Título de la malla
        const nombreMalla = document.getElementById('input-nombre-malla').value.trim();
        if (nombreMalla) {
            document.getElementById('titulo-malla-pantalla').innerText = `Malla: ${nombreMalla}`;
        }

        // Agrupar materias por Año
        const tipoPeriodo = document.getElementById('select-tipo-periodo').value || 'Semestre';
        const esSemestral = tipoPeriodo.toLowerCase() === 'semestre';
        const porAño      = {};

        datosMalla.forEach(materia => {
            const numAno = esSemestral ? Math.ceil(materia.nivel / 2) : materia.nivel;
            if (!porAño[numAno]) porAño[numAno] = [];
            porAño[numAno].push(materia);
        });

        // Construir un acordeón por cada Año
        Object.keys(porAño).sort((a, b) => a - b).forEach(ano => {
            const materiasDeLAno = porAño[ano];

            const accGroup = document.createElement('div');
            accGroup.className = 'mobile-accordion-group';
            accGroup.dataset.ano = ano;

            // Header del acordeón con mini barra de progreso
            const header = document.createElement('div');
            header.className = 'mobile-accordion-header active';
            header.innerHTML = `
                <div class="mob-year-left">
                    <div class="mob-year-badge">Año ${ano}</div>
                    <div class="mob-year-progress">
                        <div class="mob-year-bar"><div class="mob-year-bar-fill"></div></div>
                        <span class="mob-year-counter">0/${materiasDeLAno.length}</span>
                    </div>
                </div>
                <i class="fas fa-chevron-down mob-chevron"></i>
            `;

            // Contenido expandible con grid de 2 columnas (semestres)
            const content = document.createElement('div');
            content.className = 'mobile-accordion-content';
            content.style.maxHeight = '3000px'; // Abierto por defecto

            const gridYear = document.createElement('div');
            gridYear.className = 'mobile-year-grid';

            if (esSemestral) {
                const semImpar = ano * 2 - 1;
                const semPar   = ano * 2;

                const col1 = document.createElement('div');
                col1.className = 'mobile-semester-col';
                col1.innerHTML = `<div class="mobile-semester-title"><i class="fas fa-circle-dot"></i> ${tipoPeriodo} ${semImpar}</div>`;

                const col2 = document.createElement('div');
                col2.className = 'mobile-semester-col';
                col2.innerHTML = `<div class="mobile-semester-title"><i class="fas fa-circle-dot"></i> ${tipoPeriodo} ${semPar}</div>`;

                materiasDeLAno.forEach(materia => {
                    const tarjeta = _crearTarjeta(materia);
                    (materia.nivel % 2 !== 0 ? col1 : col2).appendChild(tarjeta);
                });

                gridYear.appendChild(col1);
                gridYear.appendChild(col2);
            } else {
                // Malla anual → una columna completa
                const colUnica = document.createElement('div');
                colUnica.className = 'mobile-semester-col mobile-semester-col--full';
                materiasDeLAno.forEach(m => colUnica.appendChild(_crearTarjeta(m)));
                gridYear.appendChild(colUnica);
            }

            content.appendChild(gridYear);

            // Toggle del acordeón al tocar el header
            header.addEventListener('click', () => {
                const abierto = header.classList.contains('active');
                header.classList.toggle('active');
                content.style.maxHeight = abierto ? null : content.scrollHeight + 'px';
            });

            accGroup.appendChild(header);
            accGroup.appendChild(content);
            contenedor.appendChild(accGroup);
        });

        // Actualizar estados (disponible/bloqueada) y barra de progreso global
        G.actualizarMallaYLineas();

        // Reajustar alturas reales y mini-barras tras el primer render
        setTimeout(() => {
            document.querySelectorAll('.mobile-accordion-header.active').forEach(h => {
                h.nextElementSibling.style.maxHeight = h.nextElementSibling.scrollHeight + 'px';
            });
            G.actualizarMiniProgreso();
        }, 60);
    };

    // ─────────────────────────────────────────────────────────────────
    // _crearTarjeta(materia) — Helper privado
    // Construye un div.tarjeta-materia con los mismos atributos que usa
    // el módulo de escritorio (malla.js), de modo que el Core no nota
    // la diferencia de vista.
    // ─────────────────────────────────────────────────────────────────
    function _crearTarjeta(materia) {
        const tienePrereq = materia.prerrequisitos && materia.prerrequisitos.length > 0;

        const tarjeta = document.createElement('div');
        tarjeta.className = `tarjeta-materia ${tienePrereq ? 'bloqueada' : 'disponible'}`;
        tarjeta.id = materia.id;

        if (tienePrereq) {
            tarjeta.setAttribute('data-prerrequisitos', JSON.stringify(materia.prerrequisitos));
        }

        const idEsc     = window.escapeHTML ? window.escapeHTML(materia.id)     : materia.id;
        const nombreEsc = window.escapeHTML ? window.escapeHTML(materia.nombre) : materia.nombre;

        tarjeta.innerHTML = `
            <div class="encabezado-materia"><span>${idEsc}</span></div>
            <div class="nombre-materia">${nombreEsc}</div>
            <div class="mob-card-status-dot"></div>
        `;

        tarjeta.addEventListener('click', function () {
            if (this.classList.contains('bloqueada')) return;
            if (this.classList.contains('aprobada')) {
                this.classList.replace('aprobada', 'disponible');
            } else {
                this.classList.replace('disponible', 'aprobada');
            }
            // Mismas llamadas que usa el escritorio — Core compartido
            G.actualizarMallaYLineas();
            G.actualizarMiniProgreso();
            if (G.guardarProgreso) G.guardarProgreso();
            if (document.getElementById('modal-horario').style.display === 'flex' && G.cargarMateriasEnPanelHorario) {
                G.cargarMateriasEnPanelHorario();
            }
        });

        return tarjeta;
    }
}
