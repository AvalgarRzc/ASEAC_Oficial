function initHorario(G) {

    const modalHorario    = document.getElementById('modal-horario');
    const btnAbrirHorario  = document.getElementById('btn-abrir-horario');
    const btnCerrarHorario = document.getElementById('btn-cerrar-horario');
    const tabMaterias      = document.getElementById('tab-btn-materias-horario');
    const tabCuadricula    = document.getElementById('tab-btn-cuadricula-horario');
    const tabLabelCuad     = document.getElementById('tab-label-cuadricula');
    const btnVolverMat     = document.getElementById('btn-volver-materias-horario');
    const bannerMateria    = document.getElementById('banner-materia-activa-mobile');
    const txtMateria       = document.getElementById('txt-materia-activa-mobile');

    function cambiarVistaHorarioMobile(vista) {
        if (!modalHorario) return;
        if (vista === 'cuadricula') {
            modalHorario.classList.add('modo-cuadricula-mobile');
            if (tabMaterias) tabMaterias.classList.remove('activo');
            if (tabCuadricula) tabCuadricula.classList.add('activo');
        } else {
            modalHorario.classList.remove('modo-cuadricula-mobile');
            if (tabMaterias) tabMaterias.classList.add('activo');
            if (tabCuadricula) tabCuadricula.classList.remove('activo');
        }
    }

    function actualizarBannerMateriaMobile() {
        if (!bannerMateria || !txtMateria) return;
        if (G.materiaSeleccionadaHorario) {
            const sigla = G.materiaSeleccionadaHorario.id;
            const color = G.obtenerColorPorSigla ? G.obtenerColorPorSigla(sigla) : '#38bdf8';
            bannerMateria.style.setProperty('--materia-color', color);
            bannerMateria.classList.add('activa');
            txtMateria.innerHTML = `Pintando: <strong style="color:${color}">${window.escapeHTML ? window.escapeHTML(sigla) : sigla}</strong>`;
            if (tabLabelCuad) tabLabelCuad.textContent = `Horario (${sigla})`;
        } else {
            bannerMateria.classList.remove('activa');
            txtMateria.innerHTML = '<span>Toca para asignar</span>';
            if (tabLabelCuad) tabLabelCuad.textContent = 'Horario Semanal';
        }
    }

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

    const HORAS_MANANA   = generarFranjas('08:00', '12:30');
    const HORAS_TARDE    = generarFranjas('13:30', '18:00');
    const HORAS_NOCHE    = generarFranjas('18:00', '22:30');
    const HORAS_COMPLETO = generarFranjas('08:00', '22:30');
    const DIAS_LABEL     = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

    const TURNOS = [
        { id: 'manana',   label: 'Mañana',   rango: '08:00 – 12:30', horas: HORAS_MANANA   },
        { id: 'tarde',    label: 'Tarde',    rango: '13:30 – 18:00', horas: HORAS_TARDE    },
        { id: 'noche',    label: 'Noche',    rango: '18:00 – 22:30', horas: HORAS_NOCHE    },
        { id: 'completo', label: 'Completo', rango: '08:00 – 22:30', horas: HORAS_COMPLETO },
    ];

    G.materiaSeleccionadaHorario = null;

    function inyectarEstructuraHorario() {
        const espacioCalendario = document.querySelector('.calendar-espacio');

        const tabsHTML = TURNOS.map((t, i) =>
            `<button class="tab-turno${i === 0 ? ' activo' : ''}" data-turno="${t.id}">
                ${t.label} <small>${t.rango}</small>
            </button>`
        ).join('');

        const gridsHTML = TURNOS.map((t, i) =>
            `<div id="grid-${t.id}" class="grid-turno${i === 0 ? ' activo' : ''}"></div>`
        ).join('');

        espacioCalendario.innerHTML = `
            <div class="turnos-tabs">${tabsHTML}</div>
            ${gridsHTML}
        `;

        TURNOS.forEach(t => construirGrid(`grid-${t.id}`, t.horas));

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

    function construirGrid(idGrid, horas) {
        const grid = document.getElementById(idGrid);
        grid.innerHTML = '';

        const cabeceras = ['Hora', ...DIAS_LABEL];
        cabeceras.forEach(txt => {
            const h = document.createElement('div');
            h.className = 'celda-header';
            h.innerText = txt;
            grid.appendChild(h);
        });

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
            if (window.innerWidth <= 768) {
                if (G.mostrarToast) G.mostrarToast('Primero selecciona una materia');
                else alert('Primero selecciona una materia.');
                cambiarVistaHorarioMobile('materias');
            } else {
                alert('Primero selecciona una materia del panel izquierdo.');
            }
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

    G.cargarMateriasEnPanelHorario = function() {
        const contenedor = document.getElementById('lista-materias-horario');
        contenedor.innerHTML = '';
        G.materiaSeleccionadaHorario = null;

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
                actualizarBannerMateriaMobile();
                if (window.innerWidth <= 768) {
                    cambiarVistaHorarioMobile('cuadricula');
                }
            });

            contenedor.appendChild(pill);
        });
    }

    if (tabMaterias) {
        tabMaterias.addEventListener('click', () => cambiarVistaHorarioMobile('materias'));
    }
    if (tabCuadricula) {
        tabCuadricula.addEventListener('click', () => cambiarVistaHorarioMobile('cuadricula'));
    }
    if (btnVolverMat) {
        btnVolverMat.addEventListener('click', () => cambiarVistaHorarioMobile('materias'));
    }

    btnAbrirHorario.addEventListener('click', () => {
        modalHorario.style.display = 'flex';
        cambiarVistaHorarioMobile('materias');
        G.cargarMateriasEnPanelHorario();
        actualizarBannerMateriaMobile();
    });

    btnCerrarHorario.addEventListener('click', () => {
        modalHorario.style.display = 'none';
        cambiarVistaHorarioMobile('materias');
    });

    modalHorario.addEventListener('click', e => {
        if (e.target === modalHorario) {
            modalHorario.style.display = 'none';
            cambiarVistaHorarioMobile('materias');
        }
    });

    document.getElementById('btn-limpiar-horario').addEventListener('click', () => {
        document.querySelectorAll('.celda-dia').forEach(c => {
            c.innerHTML     = '';
            c.style.padding = '';
        });
        Object.keys(G.bloquesPorCelda).forEach(k => delete G.bloquesPorCelda[k]);
        G.guardarHorario();
        G.materiaSeleccionadaHorario = null;
        actualizarBannerMateriaMobile();
        G.cargarMateriasEnPanelHorario();
    });

    inyectarEstructuraHorario();

}
