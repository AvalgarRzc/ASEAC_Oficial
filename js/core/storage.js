// ********************************************************************
// *  storage.js — Gestión de LocalStorage (Core)                     *
// *                                                                  *
// *  Propósito: Proveer funciones de guardado en el navegador para   *
// *  el progreso de la malla y el horario. Define las claves base.   *
// ********************************************************************

function initStorage(G) {
    // =============================================
    // PERSISTENCIA
    // G.SK: claves de localStorage centralizadas.
    // =============================================
    G.SK = {
        malla:    'aseac-malla-datos',
        nombre:   'aseac-malla-nombre',
        periodo:  'aseac-malla-periodo',
        progreso: 'aseac-progreso',
        horario:  'aseac-horario',
        tema:     'aseac-tema',
    };

    G.guardarMalla = function(datos, nombre, tipoPeriodo) {
        try {
            localStorage.setItem(G.SK.malla,   JSON.stringify(datos));
            localStorage.setItem(G.SK.nombre,  nombre || '');
            localStorage.setItem(G.SK.periodo, tipoPeriodo || 'Semestre');
        } catch(e) {}
    };

    G.guardarProgreso = function() {
        try {
            const aprobadas = [...document.querySelectorAll('.tarjeta-materia.aprobada')]
                .map(t => t.id);
            localStorage.setItem(G.SK.progreso, JSON.stringify(aprobadas));
        } catch(e) {}
    };

    G.guardarHorario = function() {
        try {
            localStorage.setItem(G.SK.horario, JSON.stringify(G.bloquesPorCelda));
        } catch(e) {}
    };



    G.restaurarHorarioPintado = function() {
        try {
            Object.entries(G.bloquesPorCelda).forEach(([key, sigla]) => {
                const sep  = key.indexOf('-');
                const dia  = key.slice(0, sep);
                const hora = key.slice(sep + 1);
                const celdas = document.querySelectorAll(
                    `.celda-dia[data-dia="${dia}"][data-hora="${hora}"]`
                );
                if (celdas.length === 0) return;
                const tarjeta = document.getElementById(sigla);
                const nombre  = tarjeta
                    ? tarjeta.querySelector('.nombre-materia').innerText
                    : sigla;
                const color = G.obtenerColorPorSigla(sigla);
                celdas.forEach(celda => {
                    celda.style.padding = '2px';
                    celda.innerHTML = `
                        <div class="bloque-materia" style="background:${color}; color:#000;">
                            <span>${sigla}</span>
                            <span style="font-weight:normal;font-size:0.62em;">${nombre}</span>
                        </div>`;
                });
            });
        } catch(e) { console.warn('ASEAC: error restaurando horario', e); }
    };
}
