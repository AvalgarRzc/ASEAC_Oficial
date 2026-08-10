// ********************************************************************
// *  app.js — Orquestador principal de ASEAC                        *
// *                                                                  *
// *  Propósito: Punto de entrada de la aplicación. Inicializa       *
// *  todas las funciones del Core y los Módulos de la UI, en el     *
// *  orden correcto de dependencias. También declara variables      *
// *  globales en el objeto G.                                       *
// *                                                                  *
// *  FIX v1.1: Se agregó initApuntes(G) al final de la cadena.     *
// *  Antes, apuntes.js era un módulo ES autoejecutable sin acceso   *
// *  a G. Ahora sigue el patrón estándar del resto de módulos.      *
// ********************************************************************

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. Namespace compartido ──────────────────────────────────
    const G = {
        mallaActualEnPantalla     : [],
        lineasConexion            : [],
        bloquesPorCelda           : {},
        colorLineaInactiva        : '#505863',
        materiaSeleccionadaHorario: null,
        // Fallback de color por sigla (obtenerColorPorSigla lee la CSS var
        // --color-disponible en vivo; este array solo aplica si la var falla).
        coloresNeon: [
            '#c9a24b', // ámbar base
            '#d4ad57', // ámbar claro +
            '#bd9640', // ámbar oscuro -
            '#dab868', // ámbar muy claro
            '#b08a37', // ámbar oscuro
            '#c5993e', // ámbar intermedio
        ],
    };

    // ── 2. Inicializar módulos en orden de dependencias ──────────

    // Toggle del menú hamburguesa (utilidades y temas)
    const btnMenu = document.getElementById('btn-menu-utilidades');
    const navUtilidades = document.getElementById('nav-utilidades');
    if (btnMenu && navUtilidades) {
        btnMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            navUtilidades.classList.toggle('oculto');
        });

        // Cerrar al hacer clic fuera del menú de hamburguesa
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#menu-utilidades-wrapper')) {
                navUtilidades.classList.add('oculto');
            }
        });
    }

    initUtils(G);       // obtenerColorPorSigla
    initStorage(G);     // SK · guardar* · restaurarHorarioPintado
    initMalla(G);       // dibujarLineas · renderizarMallaDinamica · actualizarMallaYLineas
    initHorario(G);     // inyectarEstructuraHorario · cargarMateriasEnPanelHorario
    initModales(G);     // wizard · apoyo · PWA · notificaciones · PDF · mostrarToast
    initMobile(G);      // ⚠ DEBE ir ANTES de initRestaurar: registra G.renderizarMallaMobile
    initRestaurar(G);   // restaura malla + progreso + horario desde localStorage
    initTheme(G);       // TEMAS · aplicarTema · crearSelectorTemas
    initTareas(G);      // Módulo 2: calendario interactivo
    initEstudio(G);     // Módulo 3: temporizador Pomodoro
    // FIX v1.1: initApuntes(G) agregado aquí — antes era un módulo ES autoejecutable
    // sin acceso a G. Ahora sigue el patrón estándar y puede integrarse con el namespace.
    initApuntes(G);     // Módulo 4: bloc de notas con imágenes (IndexedDB)

    // Rediseño: expone G para que js/core/panel-lateral.js (script nuevo
    // y aislado) pueda sincronizar las líneas LeaderLine al filtrar por año.
    // No cambia ningún comportamiento existente de la app.
    window.G = G;

});
