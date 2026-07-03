// ********************************************************************
// *  js/mobile/mobile-navbar.js — Barra de Navegación Inferior     *
// *                                                                  *
// *  Propósito: Construir e inyectar la Bottom Bar de navegación.   *
// *  Solo se activa en pantallas ≤ 768px.                          *
// *  Delega eventos a los botones de escritorio — sin duplicar      *
// *  lógica. Para añadir botones, edita el array "botones".        *
// *                                                                  *
// *  Para modificar estilos → css/mobile/mobile-navbar.css          *
// ********************************************************************

function initMobileNavbar() {
    // Solo en dispositivos móviles
    if (window.innerWidth > 768) return;

    // ─────────────────────────────────────────────────────────────────
    // Definición de botones de la Bottom Bar
    // Formato: [id-móvil, id-desktop-destino, clase-icono-FA, etiqueta, clase-extra]
    // Para añadir o quitar botones, edita solo este array.
    // ─────────────────────────────────────────────────────────────────
    const botones = [
        ['mob-btn-reiniciar', 'btn-reiniciar',     'fa-redo-alt',      'Reiniciar', 'mob-danger'],
        ['mob-btn-horario',   'btn-abrir-horario', 'fa-calendar-week', 'Horario',   ''],
        ['mob-btn-tareas',    'btn-abrir-tareas',  'fa-tasks',         'Tareas',    ''],
        ['mob-btn-estudio',   'btn-abrir-estudio', 'fa-brain',         'Estudio',   ''],
        ['mob-btn-apuntes',   'btn-abrir-apuntes', 'fa-book-open',     'Apuntes',   ''],
        ['mob-btn-importar',  'btn-importar',      'fa-file-import',   'Importar',  ''],
        ['mob-btn-exportar',  'btn-exportar',      'fa-file-export',   'Exportar',  ''],
        // ⏸ IA EN PAUSA — descomentar cuando el servidor-cliente esté optimizado
        // ['mob-btn-ia',     'btn-abrir-ia',      'fa-robot',         'IA',        ''],
    ];

    // Construir el <nav> de la Bottom Bar
    const nav = document.createElement('nav');
    nav.className = 'mob-bottom-bar';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Navegación móvil');

    botones.forEach(([mobId, desktopId, icon, label, extraClass]) => {
        const btn = document.createElement('button');
        btn.id        = mobId;
        btn.className = 'mob-nav-btn' + (extraClass ? ' ' + extraClass : '');
        btn.setAttribute('aria-label', label);
        btn.innerHTML = `<i class="fas ${icon}"></i><span>${label}</span>`;

        // Delegar clic al botón de escritorio equivalente (sin duplicar lógica)
        const desk = document.getElementById(desktopId);
        if (desk) {
            btn.addEventListener('click', () => desk.click());
        }

        nav.appendChild(btn);
    });

    // Insertar la barra en el DOM
    document.body.appendChild(nav);
}
