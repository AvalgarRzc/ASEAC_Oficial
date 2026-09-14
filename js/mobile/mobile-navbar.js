function initMobileNavbar() {

    if (document.querySelector('.mob-bottom-bar')) return;

    const botones = [
        ['mob-btn-reiniciar', 'btn-reiniciar',     'fa-redo-alt',      'Reiniciar', 'mob-danger'],
        ['mob-btn-horario',   'btn-abrir-horario', 'fa-calendar-week', 'Horario',   ''],
        ['mob-btn-tareas',    'btn-abrir-tareas',  'fa-tasks',         'Tareas',    ''],
        ['mob-btn-estudio',   'btn-abrir-estudio', 'fa-brain',         'Estudio',   ''],
        ['mob-btn-apuntes',   'btn-abrir-apuntes', 'fa-book-open',     'Apuntes',   ''],
        ['mob-btn-importar',  'btn-importar',      'fa-file-import',   'Importar',  ''],
        ['mob-btn-exportar',  'btn-exportar',      'fa-file-export',   'Exportar',  ''],

    ];

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

        const desk = document.getElementById(desktopId);
        if (desk) {
            btn.addEventListener('click', () => desk.click());
        }

        nav.appendChild(btn);
    });

    document.body.appendChild(nav);
}
