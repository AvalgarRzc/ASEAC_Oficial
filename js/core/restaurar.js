// ********************************************************************
// *  restaurar.js — Restauración de Sesión (Core)                    *
// *                                                                  *
// *  Propósito: Ejecutar una función IIFE al iniciar que lee el      *
// *  progreso, horario y configuración almacenada en LocalStorage    *
// *  y los aplica a la UI.                                           *
// *                                                                  *
// *  FIX v1.1 — Bug de flechas iluminadas antes de tiempo:          *
// *  actualizarMallaYLineas() ahora se llama con doble              *
// *  requestAnimationFrame, igual que dibujarLineas(). Así se        *
// *  garantiza que LeaderLine terminó de dibujar ANTES de que se     *
// *  sincronicen los colores de las flechas con el estado aprobada.  *
// ********************************************************************

function initRestaurar(G) {
    // IIFE que se ejecuta una sola vez al cargar la página.
    // Recupera de localStorage en este orden:
    //   1. Malla personalizada
    //   2. Progreso aprobadas
    //   3. Horario pintado
    (function restaurarSesion() {
        try {
            // 1. Restaurar malla personalizada si existe
            const mallaGuardada = localStorage.getItem(G.SK.malla);
            if (mallaGuardada) {
                const datos      = JSON.parse(mallaGuardada);
                const nombre     = localStorage.getItem(G.SK.nombre) || '';
                const tipoPer    = localStorage.getItem(G.SK.periodo) || 'Semestre';

                G.mallaActualEnPantalla = datos;

                // Actualizar título
                if (nombre) {
                    document.getElementById('titulo-malla-pantalla').innerText =
                        `Malla Curricular: ${nombre}`;
                }

                // Sobrescribir select-tipo-periodo para que G.renderizarMallaDinamica use el correcto
                document.getElementById('select-tipo-periodo').value = tipoPer;
                document.getElementById('input-nombre-malla').value  = nombre;

                G.renderizarMallaDinamica(datos);
            }

            // 2. Restaurar progreso (materias aprobadas)
            // FIX v1.1: actualizarMallaYLineas() se llama con doble
            // requestAnimationFrame para asegurar que LeaderLine ya terminó
            // de dibujar las flechas (que también usa rAF doble en dibujarLineas).
            // Si se llama antes, las flechas leen el estado aprobada → se iluminan
            // aunque aún no se haya completado el primer render de la malla.
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
                // Esperar al mismo ciclo que usa dibujarLineas antes de sincronizar
                if (aprobadas.length > 0) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => G.actualizarMallaYLineas());
                    });
                }
            }

            // 3. Restaurar horario: cargar datos + pintar celdas inmediatamente
            // Filtrar bloques fantasma: solo aceptar horas válidas 08:00–22:30 cada 30 min
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
