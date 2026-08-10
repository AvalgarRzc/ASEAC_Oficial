// ********************************************************************
// * theme.js — Sistema de Temas (Core)                              *
// * *
// * Propósito: Definir y aplicar los temas de colores de la app.    *
// * También maneja la UI para seleccionar temas (selector flotante).*
// ********************************************************************

function initTheme(G) {
    // TEMAS: diccionario de temas. Cada tema define los colores clave:
    const TEMAS = {
        // ════════════════════════════════════════════════════════════
        //  TEMAS BASADOS EN SECTORES  —  Paletas formales de color
        // ════════════════════════════════════════════════════════════

        // 1. Clínica / Salud
        salud: {
            nombre: 'Clínica · Salud',
            disponible: '#60A5FA',
            aprobada:   '#86EFAC',
            bloqueada:  '#0F2A40',
            fondo:      '#080F1C',
            columna:    'rgba(96,165,250,0.07)',
            tarjeta:    'rgba(96,165,250,0.12)',
            navbar:     '#05091A',
        },

        // 2. Estética / Belleza Natural
        belleza: {
            nombre: 'Estética · Belleza',
            disponible: '#6EE7B7',
            aprobada:   '#C4B5FD',
            bloqueada:  '#1E1430',
            fondo:      '#0E0B1C',
            columna:    'rgba(110,231,183,0.06)',
            tarjeta:    'rgba(196,181,253,0.09)',
            navbar:     '#09071A',
        },

        // 3. E-commerce Juvenil
        ecommerce: {
            nombre: 'E-commerce Juvenil',
            disponible: '#FCD34D',
            aprobada:   '#2DD4BF',
            bloqueada:  '#2A1E08',
            fondo:      '#141008',
            columna:    'rgba(252,211,77,0.07)',
            tarjeta:    'rgba(252,211,77,0.12)',
            navbar:     '#0C0A04',
        },

        // 4. Moda Urbana / Skate / Streetwear
        urbano: {
            nombre: 'Moda Urbana · Skate',
            disponible: '#F87171',
            aprobada:   '#A3E635',
            bloqueada:  '#2A2A2A',
            fondo:      '#0F0F0F',
            columna:    'rgba(248,113,113,0.07)',
            tarjeta:    'rgba(248,113,113,0.12)',
            navbar:     '#090909',
        },

        // 5. Gastronomía Orgánica
        organica: {
            nombre: 'Gastronomía Orgánica',
            disponible: '#84CC16',
            aprobada:   '#F59E0B',
            bloqueada:  '#1E1C0A',
            fondo:      '#0E0E06',
            columna:    'rgba(132,204,22,0.07)',
            tarjeta:    'rgba(132,204,22,0.11)',
            navbar:     '#080804',
        },

        // 6. Restaurante Gourmet / Alta Cocina
        gourmet: {
            nombre: 'Restaurante Gourmet',
            disponible: '#D4AF37',
            aprobada:   '#BE3144',
            bloqueada:  '#1A1000',
            fondo:      '#0A0800',
            columna:    'rgba(212,175,55,0.07)',
            tarjeta:    'rgba(212,175,55,0.11)',
            navbar:     '#060500',
        },

        // 7. Agencia Creativa
        creativa: {
            nombre: 'Agencia Creativa',
            disponible: '#F472B6',
            aprobada:   '#818CF8',
            bloqueada:  '#2A0A28',
            fondo:      '#10061A',
            columna:    'rgba(244,114,182,0.07)',
            tarjeta:    'rgba(129,140,248,0.10)',
            navbar:     '#0A0414',
        },

        // 8. Abogados / Legal / Notarías
        legal: {
            nombre: 'Legal · Abogados',
            disponible: '#93C5FD',
            aprobada:   '#FCD34D',
            bloqueada:  '#111C30',
            fondo:      '#070D1E',
            columna:    'rgba(147,197,253,0.06)',
            tarjeta:    'rgba(147,197,253,0.10)',
            navbar:     '#050914',
        },

        // 9. Finanzas / Seguros
        finanzas: {
            nombre: 'Finanzas · Seguros',
            disponible: '#0EA5E9',
            aprobada:   '#0D9488',
            bloqueada:  '#0A2030',
            fondo:      '#05101C',
            columna:    'rgba(14,165,233,0.07)',
            tarjeta:    'rgba(14,165,233,0.11)',
            navbar:     '#030A14',
        },

        // 10. Sector Tecnológico / Startups
        tech: {
            nombre: 'Tecnología · Startups',
            disponible: '#3B82F6',
            aprobada:   '#A3E635',
            bloqueada:  '#101C34',
            fondo:      '#070E1E',
            columna:    'rgba(59,130,246,0.07)',
            tarjeta:    'rgba(59,130,246,0.12)',
            navbar:     '#040914',
        },

        // 11. Turismo / Viajes
        viajes: {
            nombre: 'Turismo · Viajes',
            disponible: '#38BDF8',
            aprobada:   '#FB923C',
            bloqueada:  '#0E2030',
            fondo:      '#060F18',
            columna:    'rgba(56,189,248,0.06)',
            tarjeta:    'rgba(251,146,60,0.09)',
            navbar:     '#040A10',
        },

        // 12. ONGs / Sector Social
        social: {
            nombre: 'ONGs · Sector Social',
            disponible: '#22C55E',
            aprobada:   '#FB923C',
            bloqueada:  '#0A2010',
            fondo:      '#060F08',
            columna:    'rgba(34,197,94,0.07)',
            tarjeta:    'rgba(34,197,94,0.11)',
            navbar:     '#040A06',
        },

        // 13. Educación / Formación Online — ★ PREDETERMINADO (ASEAC)
        edu: {
            nombre: 'Educación',
            disponible: '#00e5ff',      // Cian brillante para malla
            aprobada:   '#22c55e',      // Verde éxito para aprobadas
            bloqueada:  '#1f2937',      // Gris oscuro para bloqueadas
            columna:    'rgba(0, 229, 255, 0.05)',
            tarjeta:    'rgba(0, 229, 255, 0.08)',
            navbar:     '#1a1c20',      // Base gris oscuro/antracita
            fondo:      '#0f1115',      // Fondo general
            acento:     '#00e5ff',      // Cian para botones activos e IA
            textoPrincipal: '#ffffff',  // Blanco puro para títulos
            textoSecundario: '#9ca3af', // Gris claro descripciones
            desplegableFondo: '#242730' // Fondo elevado para menús
        }
    };

    // aplicarTema(id)
    // Aplica un tema al document.documentElement via CSS custom properties.
    function aplicarTema(id) {
        const t = TEMAS[id];
        if (!t) return;
        const r = document.documentElement.style;
        
        // Variables base de la malla
        r.setProperty('--color-disponible', t.disponible);
        r.setProperty('--color-aprobada',   t.aprobada);
        r.setProperty('--color-bloqueada',  t.bloqueada);
        r.setProperty('--carbon-fondo',     t.fondo);
        r.setProperty('--carbon-columna',   t.columna);
        r.setProperty('--carbon-tarjeta',   t.tarjeta);
        
        // Variables de texto y UI general (con fallback)
        r.setProperty('--texto-principal',  t.textoPrincipal || '#f8fafc');
        r.setProperty('--texto-secundario', t.textoSecundario || '#94a3b8');
        r.setProperty('--color-acento',     t.acento || t.disponible); 
        r.setProperty('--desplegable-fondo', t.desplegableFondo || t.navbar);
        r.setProperty('--ct-sidebar-bg',      t.navbar || t.fondo || '#1a1c20');


        // Marcar botón activo en el panel de temas
        document.querySelectorAll('.btn-tema').forEach(b => b.classList.remove('activo'));
        const btn = document.querySelector(`.btn-tema[data-tema="${id}"]`);
        if (btn) btn.classList.add('activo');

        // Guardar preferencia
        localStorage.setItem('aseac-tema', id);

        // Redibujar flechas con nuevos colores (si existe la función en G)
        // Actualiza el color "activo" cacheado de cada línea para que las flechas
        // ya dibujadas también cambien de color al elegir un tema nuevo.
        if (G && Array.isArray(G.lineasConexion)) {
            const nuevoColorActivo = t.disponible;
            G.lineasConexion.forEach(c => { c.colorActivo = nuevoColorActivo; });
            if (typeof G.actualizarMallaYLineas === 'function') {
                setTimeout(G.actualizarMallaYLineas, 50);
            }
        }
    }

    // crearSelectorTemas()
    // Inyecta dinámicamente el botón y panel de selección.
    function crearSelectorTemas() {
        const wrap = document.createElement('div');
        wrap.id = 'selector-temas';
        wrap.innerHTML = `
            <button id="btn-toggle-temas" class="nav-util-btn nav-btn nav-btn--ghost" data-tip="Cambiar tema">🎨</button>
            <div id="panel-temas" class="panel-temas oculto">
                <p class="temas-titulo">Tema de color</p>
                <div class="temas-grid">
                    ${Object.entries(TEMAS).map(([id, t]) => `
                        <button class="btn-tema" data-tema="${id}" title="${t.nombre}"
                                style="--tc: ${t.disponible};">
                            <span class="tema-dot" style="background:${t.disponible};"></span>
                            <span class="tema-label">${t.nombre}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        const utils = document.getElementById('nav-utilidades') || document.querySelector('.acciones-malla');
        if (utils) {
            utils.appendChild(wrap);
        }

        const btnToggle = document.getElementById('btn-toggle-temas');
        const panelTemas = document.getElementById('panel-temas');

        if (btnToggle && panelTemas) {
            btnToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                panelTemas.classList.toggle('oculto');
            });

            document.addEventListener('click', () => {
                panelTemas.classList.add('oculto');
            });

            document.querySelectorAll('.btn-tema').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    aplicarTema(btn.dataset.tema);
                    panelTemas.classList.add('oculto');
                });
            });
        }

        // Restaurar tema guardado o aplicar predeterminado
        const temaGuardado = localStorage.getItem('aseac-tema') || 'edu';
        aplicarTema(temaGuardado);
    }

    crearSelectorTemas();
}