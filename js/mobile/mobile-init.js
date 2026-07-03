// ********************************************************************
// *  js/mobile/mobile-init.js — Orquestador Móvil                  *
// *                                                                  *
// *  Propósito: Punto de entrada del módulo móvil. Análogo a        *
// *  app.js pero solo para la versión mobile. Llama a los           *
// *  submódulos en el orden correcto de dependencias:               *
// *                                                                  *
// *    1. initMobileMalla(G)   → js/mobile/mobile-malla.js          *
// *    2. initMobileNavbar()   → js/mobile/mobile-navbar.js         *
// *    + Carga dinámica de CSS → css/mobile/mobile-navbar.css       *
// *                              css/mobile/mobile-malla.css        *
// *                                                                  *
// *  Para añadir nuevos módulos móviles (ej. mobile-horario.js),    *
// *  solo basta crear el archivo y llamarlo aquí.                   *
// ********************************************************************

function initMobile(G) {

    // ── 1. Módulo: Malla Móvil (Acordeón por Año) ─────────────────────
    // Registra G.renderizarMallaMobile y G.actualizarMiniProgreso en el
    // namespace global G. DEBE ejecutarse antes de initRestaurar para
    // que la restauración de localStorage ya use la vista móvil.
    initMobileMalla(G);

    // ── 2. Resto de la UI (solo si pantalla ≤ 768px) ──────────────────
    if (window.innerWidth > 768) return;

    // ── 3. Cargar hojas de estilo específicas para móvil ──────────────
    _cargarCSS('css/mobile/mobile-navbar.css');
    _cargarCSS('css/mobile/mobile-malla.css');

    // ── 4. Módulo: Barra de Navegación Inferior ────────────────────────
    initMobileNavbar();

    // ── Helper: inyectar un <link> CSS si no existe ya ─────────────────
    function _cargarCSS(href) {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.rel  = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }
    }
}
