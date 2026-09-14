function initRestaurar(G) {

    (function restaurarSesion() {
        try {

            const mallaGuardada = localStorage.getItem(G.SK.malla);
            if (mallaGuardada) {
                const datos      = JSON.parse(mallaGuardada);
                const nombre     = localStorage.getItem(G.SK.nombre) || '';
                const tipoPer    = localStorage.getItem(G.SK.periodo) || 'Semestre';

                G.mallaActualEnPantalla = datos;

                if (nombre) {
                    document.getElementById('titulo-malla-pantalla').innerText =
                        `Malla Curricular: ${nombre}`;
                }

                document.getElementById('select-tipo-periodo').value = tipoPer;
                document.getElementById('input-nombre-malla').value  = nombre;

                G.renderizarMallaDinamica(datos);
            }

            const progresoGuardado = localStorage.getItem(G.SK.progreso);
            if (progresoGuardado) {
                const aprobadas = JSON.parse(progresoGuardado);
                aprobadas.forEach(id => {
                    const t = document.getElementById(id);
                    if (t) {
                        t.classList.remove('bloqueada', 'disponible');
                        t.classList.add('aprobada');
                    }
                });

                if (aprobadas.length > 0) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => G.actualizarMallaYLineas());
                    });
                }
            }

            const horarioGuardado = localStorage.getItem(G.SK.horario);
            if (horarioGuardado) {
                const todasFranjas = new Set();
                let _h = 8, _m = 0;
                while (_h < 22 || (_h === 22 && _m <= 30)) {
                    todasFranjas.add(`${String(_h).padStart(2,'0')}:${String(_m).padStart(2,'0')}`);
                    _m += 30; if (_m >= 60) { _m -= 60; _h++; }
                }
                const raw = JSON.parse(horarioGuardado);
                const filtrado = {};
                Object.entries(raw).forEach(([key, sigla]) => {
                    const sep  = key.indexOf('-');
                    const hora = key.slice(sep + 1);
                    if (todasFranjas.has(hora)) filtrado[key] = sigla;
                });
                Object.assign(G.bloquesPorCelda, filtrado);
                localStorage.setItem(G.SK.horario, JSON.stringify(filtrado));
                G.restaurarHorarioPintado();
            }

        } catch(e) { console.warn('ASEAC: error al restaurar sesión', e); }
    })();
}
