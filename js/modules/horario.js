// horario.js — se llama desde app.js pasando el namespace G
function initHorario(G) {
    // ─────────────────────────────────────────────────────────────
    // MODAL HORARIO — con pestañas Mañana / Tarde
    // =============================================
    const modalHorario    = document.getElementById('modal-horario');
    const btnAbrirHorario  = document.getElementById('btn-abrir-horario');
    const btnCerrarHorario = document.getElementById('btn-cerrar-horario');

    // generarFranjas(horaInicio, horaFin, intervaloMin)
    // Genera un array de strings "HH:MM" desde horaInicio hasta horaFin
    // en intervalos de intervaloMin minutos (defecto: 30).
    // Usado para construir las filas de tiempo en los grids de horario.
    // Ejemplo: generarFranjas("08:00","10:00") → ["08:00","08:30","09:00","09:30","10:00"]
    function generarFranjas(horaInicio, horaFin, intervaloMin = 30) {
        const franjas = [];
        let [h, m] = horaInicio.split(':').map(Number);
        const [hFin, mFin] = horaFin.split(':').map(Number);
        while (h < hFin || (h === hFin && m <= mFin)) {
            franjas.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
            m += intervaloMin;
            if (m >= 60) { m -= 60; h++; }
        }
        return franjas;
    }

    // Franjas horarias por jornada
    // · Mañana   08:00 – 12:30  (intervalos de 30 min)
    // · Tarde    13:30 – 18:00
    // · Noche    18:00 – 22:30
    // · Completo 08:00 – 22:30  (jornada completa)
    const HORAS_MANANA   = generarFranjas('08:00', '12:30');
    const HORAS_TARDE    = generarFranjas('13:30', '18:00');
    const HORAS_NOCHE    = generarFranjas('18:00', '22:30');
    const HORAS_COMPLETO = generarFranjas('08:00', '22:30');
    const DIAS_LABEL     = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

    // TURNOS: tabla de configuración de las 4 jornadas.
    // Cada entrada define: id del grid, etiqueta del tab, franjas horarias.
    const TURNOS = [
        { id: 'manana',   label: '🌅 Mañana',   rango: '08:00 – 12:30', horas: HORAS_MANANA   },
        { id: 'tarde',    label: '🌇 Tarde',    rango: '13:30 – 18:00', horas: HORAS_TARDE    },
        { id: 'noche',    label: '🌃 Noche',    rango: '18:00 – 22:30', horas: HORAS_NOCHE    },
        { id: 'completo', label: '📅 Completo', rango: '08:00 – 22:30', horas: HORAS_COMPLETO },
    ];

    G.materiaSeleccionadaHorario = null;
    // G.bloquesPorCelda movido al estado global

    // inyectarEstructuraHorario()
    // Inyecta dinámicamente en .calendario-espacio:
    //   · Cuatro pestañas: Mañana / Tarde / Noche / Completo.
    //   · Un div .grid-turno por jornada (solo el activo es visible via CSS).
    // Construye cada grid con construirGrid() y asigna listeners de clic
    // para mostrar/ocultar grids via classList.toggle("activo").
    function inyectarEstructuraHorario() {
        const espacioCalendario = document.querySelector('.calendario-espacio');

        // Pestañas
        const tabsHTML = TURNOS.map((t, i) =>
            `<button class="tab-turno${i === 0 ? ' activo' : ''}" data-turno="${t.id}">
                ${t.label} <small>${t.rango}</small>
            </button>`
        ).join('');

        // Grids (solo el primero arranca activo)
        const gridsHTML = TURNOS.map((t, i) =>
            `<div id="grid-${t.id}" class="grid-turno${i === 0 ? ' activo' : ''}"></div>`
        ).join('');

        espacioCalendario.innerHTML = `
            <div class="turnos-tabs">${tabsHTML}</div>
            ${gridsHTML}
        `;

        // Construir cada grid con sus franjas
        TURNOS.forEach(t => construirGrid(`grid-${t.id}`, t.horas));

        // Listeners de pestañas
        document.querySelectorAll('.tab-turno').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-turno').forEach(b => b.classList.remove('activo'));
                btn.classList.add('activo');
                const turno = btn.dataset.turno;
                localStorage.setItem('aseac-horario-tab', turno);
                TURNOS.forEach(t => {
                    document.getElementById(`grid-${t.id}`).classList.toggle('activo', t.id === turno);
                });
            });
        });

        // Restaurar pestaña activa guardada
        const tabGuardada = localStorage.getItem('aseac-horario-tab');
        if (tabGuardada) {
            const btn = document.querySelector(`.tab-turno[data-turno="${tabGuardada}"]`);
            if (btn) {
                document.querySelectorAll('.tab-turno').forEach(b => b.classList.remove('activo'));
                btn.classList.add('activo');
                TURNOS.forEach(t => {
                    document.getElementById(`grid-${t.id}`).classList.toggle('activo', t.id === tabGuardada);
                });
            }
        }
    }

    // construirGrid(idGrid, horas)
    // Puebla el div del grid (idGrid) con:
    //   · Una fila de cabeceras: "Hora", "Lunes" ... "Sábado".
    //   · Por cada franja horaria: 1 celda-hora (etiqueta) + 6 celda-dia (lunes a sábado).
    //   · Cada celda-dia guarda data-hora y data-dia, y tiene listener de clic → manejarClicCelda().
    // El estilo de columnas y visibilidad lo maneja CSS (.grid-turno / .grid-turno.activo).
    function construirGrid(idGrid, horas) {
        const grid = document.getElementById(idGrid);
        grid.innerHTML = '';

        // Estilo del grid: columna hora + 6 días
        // Styling handled by CSS .grid-turno class

        // Fila de cabeceras
        const cabeceras = ['Hora', ...DIAS_LABEL];
        cabeceras.forEach(txt => {
            const h = document.createElement('div');
            h.className = 'celda-header';
            h.innerText = txt;
            grid.appendChild(h);
        });

        // Filas de datos
        horas.forEach(hora => {
            const celdaHora = document.createElement('div');
            celdaHora.className = 'celda-hora';
            celdaHora.innerText = hora;
            grid.appendChild(celdaHora);

            for (let dia = 1; dia <= 6; dia++) {
                const celda = document.createElement('div');
                celda.className = 'celda-dia';
                celda.dataset.hora = hora;
                celda.dataset.dia  = dia;
                celda.addEventListener('click', () => manejarClicCelda(celda, dia, hora));
                grid.appendChild(celda);
            }
        });
    }

    // manejarClicCelda(celda, dia, hora)
    // Lógica al hacer clic en una celda del horario:
    //   · Si ya tiene una materia pintada (key en G.bloquesPorCelda) → la borra y guarda.
    //   · Si no hay materia seleccionada en el panel → alerta al usuario.
    //   · Si hay materia seleccionada → pinta la celda con el color y sigla
    //     de la materia, registra la clave "dia-hora" en G.bloquesPorCelda y guarda.
    function manejarClicCelda(celda, dia, hora) {
        const key = `${dia}-${hora}`;
        const celdas = document.querySelectorAll(`.celda-dia[data-dia="${dia}"][data-hora="${hora}"]`);

        if (G.bloquesPorCelda[key]) {
            celdas.forEach(c => {
                c.innerHTML   = '';
                c.style.padding = '';
            });
            delete G.bloquesPorCelda[key];
            G.guardarHorario();
            return;
        }

        if (!G.materiaSeleccionadaHorario) {
            alert('Primero selecciona una materia del panel izquierdo.');
            return;
        }

        const color = G.obtenerColorPorSigla(G.materiaSeleccionadaHorario.id);
        celdas.forEach(c => {
            c.style.padding = '2px';
            c.innerHTML = `
                <div class="bloque-materia" style="background:${color}; color:#000;">
                    <span>${window.escapeHTML(G.materiaSeleccionadaHorario.id)}</span>
                    <span style="font-weight:normal; font-size:0.62em;">${window.escapeHTML(G.materiaSeleccionadaHorario.nombre)}</span>
                </div>
            `;
        });
        G.bloquesPorCelda[key] = G.materiaSeleccionadaHorario.id;
        G.guardarHorario();
    }

    // G.cargarMateriasEnPanelHorario()
    // Rellena el panel lateral del horario con "pills" de las materias
    // que tienen estado "disponible" (las que el alumno está cursando ahora).
    // Las aprobadas NO aparecen (ya se cursaron).
    // Al hacer clic en una pill → la marca como seleccionada y registra
    // G.materiaSeleccionadaHorario para que el siguiente clic en el grid la pinte.
    // Si no hay materias disponibles → muestra mensaje vacío.
    G.cargarMateriasEnPanelHorario = function() {
        const contenedor = document.getElementById('lista-materias-horario');
        contenedor.innerHTML = '';
        G.materiaSeleccionadaHorario = null;

        // Solo .disponible — las aprobadas ya se cursaron, no van al horario
        const materias = document.querySelectorAll('.tarjeta-materia.disponible');

        if (materias.length === 0) {
            contenedor.innerHTML = `
                <div class="horario-sin-materias">
                    <span class="horario-sin-icon">📭</span>
                    <p>No hay materias disponibles actualmente.</p>
                    <small>Aprueba prerrequisitos para desbloquear nuevas materias.</small>
                </div>`;
            return;
        }

        materias.forEach(m => {
            const nombre = m.querySelector('.nombre-materia').innerText;
            const color  = G.obtenerColorPorSigla(m.id);

            const pill = document.createElement('div');
            pill.className = 'materia-pill';
            pill.style.setProperty('--pill-color', color);
            pill.innerHTML = `
                <div class="pill-color-bar" style="background:${color};"></div>
                <div class="pill-info">
                    <strong style="color:${color}">${window.escapeHTML(m.id)}</strong>
                    <span>${window.escapeHTML(nombre)}</span>
                </div>
            `;

            pill.addEventListener('click', () => {
                document.querySelectorAll('.materia-pill').forEach(p => p.classList.remove('seleccionada'));
                pill.classList.add('seleccionada');
                G.materiaSeleccionadaHorario = { id: m.id, nombre };
            });

            contenedor.appendChild(pill);
        });
    }

    // --- Abrir / cerrar modal ---
    btnAbrirHorario.addEventListener('click', () => {
        modalHorario.style.display = 'flex';
        G.cargarMateriasEnPanelHorario();
    });

    btnCerrarHorario.addEventListener('click', () => {
        modalHorario.style.display = 'none';
    });

    // --- Limpiar todo el horario ---
    document.getElementById('btn-limpiar-horario').addEventListener('click', () => {
        document.querySelectorAll('.celda-dia').forEach(c => {
            c.innerHTML     = '';
            c.style.padding = '';
        });
        Object.keys(G.bloquesPorCelda).forEach(k => delete G.bloquesPorCelda[k]);
        G.guardarHorario();
        G.materiaSeleccionadaHorario = null;
        G.cargarMateriasEnPanelHorario();
    });

    // --- Inicializar estructura al cargar la página ---
    inyectarEstructuraHorario();

    // ─────────────────────────────────────────────────────────────
}
