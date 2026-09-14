document.addEventListener('DOMContentLoaded', () => {

    const G = {
        mallaActualEnPantalla     : [],
        lineasConexion            : [],
        bloquesPorCelda           : {},
        colorLineaInactiva        : '#b8cce4',  
        materiaSeleccionadaHorario: null,

        coloresNeon: [
            '#1565c0', 
            '#1976d2', 
            '#1e88e5', 
            '#42a5f5', 
            '#0d47a1', 
            '#1565c0', 
        ],
    };

    const btnMenu = document.getElementById('btn-menu-utilidades');
    const navUtilidades = document.getElementById('nav-utilidades');
    if (btnMenu && navUtilidades) {
        btnMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            navUtilidades.classList.toggle('oculto');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#menu-utilidades-wrapper')) {
                navUtilidades.classList.add('oculto');
            }
        });
    }

    initUtils(G);       
    initStorage(G);     
    initMalla(G);       
    initHorario(G);     
    initModales(G);     
    initMobile(G);      
    initRestaurar(G);   
    initTheme(G);       
    initTareas(G);      
    initEstudio(G);     

    initApuntes(G);     

    window.G = G;

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && typeof G.programarNotificacionesDiarias === 'function') {
        setTimeout(() => G.programarNotificacionesDiarias(true), 500);
    }

});
