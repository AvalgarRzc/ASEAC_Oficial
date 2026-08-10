// malla.js — se llama desde app.js pasando el namespace G
function initMalla(G) {
    // ─────────────────────────────────────────────────────────────
    // LÓGICA DE LÍNEAS (LeaderLine)
    // =============================================

    // G.dibujarLineas(tarjetas)
    // Crea una flecha LeaderLine entre cada materia y sus prerrequisitos.
    // · Lee el atributo data-prerrequisitos de cada tarjeta.
    // · En móvil usa path "straight" y grosor 1.5px; en desktop "fluid" 2px.
    // · Guarda cada línea en G.lineasConexion[] para poder actualizarla o eliminarla.
    // · Usa doble requestAnimationFrame para asegurar que el layout esté listo.
    G.dibujarLineas = function(tarjetas) {
        // Detectar si es móvil para abortar flechas (ya que usamos acordeones en móvil)
        const esMobil = window.innerWidth <= 768;
        if (esMobil) return;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                tarjetas.forEach(tarjeta => {
                    const reqAttr = tarjeta.getAttribute('data-prerrequisitos');
                    if (!reqAttr) return;

                    JSON.parse(reqAttr).forEach(idPrereq => {
                        const origen = document.getElementById(idPrereq);
                        if (!origen) return;

                        const linea = new LeaderLine(origen, tarjeta, {
                            color: G.colorLineaInactiva,
                            size: esMobil ? 1.5 : 2,
                            path: esMobil ? 'straight' : 'fluid',
                            startSocket: 'right',
                            endSocket: 'left',
                            dash: { animation: true }
                        });

                        G.lineasConexion.push({
                            linea,
                            origenId: idPrereq,
                            destinoId: tarjeta.id,
                            colorActivo: G.obtenerColorPorSigla(idPrereq)
                        });
                    });
                });

                G.actualizarMallaYLineas();
            });
        });
    }

    // limpiarLineas()
    // Elimina todas las flechas LeaderLine del DOM
    // y vacía el array G.lineasConexion. Se usa al cambiar de malla.
    function limpiarLineas() {
        G.lineasConexion.forEach(c => c.linea && c.linea.remove());
        G.lineasConexion.length = 0;
    }

    // =============================================
    // ACTUALIZACIÓN DE ESTADOS Y FLECHAS
    // =============================================

    // G.actualizarMallaYLineas()
    // Función central que sincroniza el estado visual de TODA la malla:
    //   1. Recorre cada tarjeta con prerrequisitos.
    //   2. Si TODOS sus prereqs están aprobados → cambia a "disponible".
    //   3. Si algún prereq NO está aprobado     → cambia a "bloqueada".
    //   4. Actualiza el color y la animación de cada flecha LeaderLine:
    //      · Aprobada → color neon con glow y sin animación dash.
    //      · No aprobada → gris con animación de guiones animados.
    G.actualizarMallaYLineas = function() {
        const tarjetasActuales = document.querySelectorAll('.tarjeta-materia');
        const aprobadas = Array.from(document.querySelectorAll('.tarjeta-materia.aprobada')).map(t => t.id);

        tarjetasActuales.forEach(tarjeta => {
            const reqAttr = tarjeta.getAttribute('data-prerrequisitos');
            if (!reqAttr) return;

            const prerrequisitos = JSON.parse(reqAttr);
            const cumpleTodos = prerrequisitos.every(req => aprobadas.includes(req));

            if (cumpleTodos) {
                if (tarjeta.classList.contains('bloqueada')) {
                    tarjeta.classList.replace('bloqueada', 'disponible');
                }
            } else {
                if (!tarjeta.classList.contains('bloqueada')) {
                    tarjeta.classList.remove('disponible', 'aprobada');
                    tarjeta.classList.add('bloqueada');
                }
            }
        });

        G.lineasConexion.forEach(({ linea, origenId, colorActivo }) => {
            if (aprobadas.includes(origenId)) {
                linea.setOptions({
                    color: colorActivo,
                    dash: false,
                    dropShadow: { color: colorActivo, dx: 0, dy: 0, blur: 10, opacity: 0.8 }
                });
            } else {
                linea.setOptions({
                    color: G.colorLineaInactiva,
                    dash: { animation: true },
                    dropShadow: false
                });
            }
        });

        // Actualizar barra de progreso
        const totalMaterias = tarjetasActuales.length;
        const cantAprobadas = aprobadas.length;
        const cantRestantes = totalMaterias - cantAprobadas;
        const porcentaje = totalMaterias === 0 ? 0 : Math.round((cantAprobadas / totalMaterias) * 100);

        const statAprobadas = document.getElementById('stat-aprobadas');
        const statRestantes = document.getElementById('stat-restantes');
        const statTotal = document.getElementById('stat-total');
        const statPorcentaje = document.getElementById('stat-porcentaje');
        const barraFill = document.getElementById('barra-progreso-fill');

        if (statAprobadas) statAprobadas.textContent = cantAprobadas;
        if (statRestantes) statRestantes.textContent = cantRestantes;
        if (statTotal) statTotal.textContent = totalMaterias;
        if (statPorcentaje) statPorcentaje.textContent = porcentaje + '%';
        if (barraFill) barraFill.style.width = porcentaje + '%';
    }
//Note que aveces las flechas indicadoras se iluminan incluso antes de marcar la materia...
    // =============================================
    // EVENTO CLICK EN TARJETA
    // =============================================

    // agregarClickTarjeta(tarjeta)
    // Asigna el listener de clic a una tarjeta de materia.
    //   · Si la tarjeta es "bloqueada" → no hace nada (sale).
    //   · Si era "aprobada" → la regresa a "disponible".
    //   · Si era "disponible" → la marca como "aprobada".
    //   Tras el cambio: actualiza malla + flechas, guarda progreso,
    //   y refresca el panel del horario si está abierto.
    function agregarClickTarjeta(tarjeta) {
        tarjeta.addEventListener('click', function () {
            if (this.classList.contains('bloqueada')) return;
            if (this.classList.contains('aprobada')) {
                this.classList.replace('aprobada', 'disponible');
            } else {
                this.classList.replace('disponible', 'aprobada');
            }
            G.actualizarMallaYLineas();
            G.guardarProgreso();
            // Refrescar panel del horario en tiempo real si está abierto
            if (document.getElementById('modal-horario').style.display === 'flex') {
                G.cargarMateriasEnPanelHorario();
            }
        });
    }

    // Inicializar tarjetas del HTML estático
    document.querySelectorAll('.tarjeta-materia').forEach(agregarClickTarjeta);
    G.dibujarLineas(document.querySelectorAll('.tarjeta-materia'));

    // Drag desactivado — columnas fijas para evitar desorden con mallas grandes

    // =============================================
    // REPOSICIONAMIENTO DE FLECHAS
    // =============================================

    // G.reposicionarLineas()
    // Llama a .position() en cada LeaderLine para que recalcule
    // su trayectoria tras mover columnas, hacer scroll o cambiar tamaño.
    // Envuelta en try/catch porque LeaderLine puede fallar si el elemento
    // fue removido del DOM entre frames.
    G.reposicionarLineas = function() {
        G.lineasConexion.forEach(c => {
            try { c.linea.position(); } catch(e) {}
        });
    }

    // Debounce para resize — redibuja completamente si cambia entre móvil/desktop
    let resizeTimer;
    let eraMovilAntes = window.innerWidth <= 768;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const esMovilAhora = window.innerWidth <= 768;

            // Si cambió entre móvil y desktop, redibujar todo
            if (esMovilAhora !== eraMovilAntes) {
                eraMovilAntes = esMovilAhora;
                const tarjetasActuales = document.querySelectorAll('.tarjeta-materia');
                limpiarLineas();
                G.dibujarLineas(tarjetasActuales);
            } else {
                G.reposicionarLineas();
            }
        }, 150);
    });

    // Scroll horizontal de la malla (desktop y móvil)
    const contenedorMalla = document.getElementById('contenedor-malla');
    contenedorMalla.addEventListener('scroll',    G.reposicionarLineas);
    contenedorMalla.addEventListener('touchmove', G.reposicionarLineas, { passive: true });
    contenedorMalla.addEventListener('touchend',  G.reposicionarLineas, { passive: true });

    // Scroll general de la ventana
    window.addEventListener('scroll', G.reposicionarLineas, { passive: true });

    // Cambio de orientación en móvil (portrait ↔ landscape)
    window.addEventListener('orientationchange', () => {
        setTimeout(G.reposicionarLineas, 300);
    });

    // =============================================
    // RENDERIZADOR DINÁMICO DE MALLA
    // =============================================

    // G.renderizarMallaDinamica(datosMalla)
    // Construye y renderiza en el DOM toda la malla curricular
    // a partir de un array de objetos materia: { id, nombre, nivel, prerrequisitos }.
    //   1. Limpia flechas existentes y vacía el contenedor.
    //   2. Actualiza el título de la página con el nombre de la malla.
    //   3. Agrupa materias por nivel (semestre/año).
    //   4. Por cada nivel crea una .columna-nivel con su h3 y tarjetas.
    //   5. Cada tarjeta recibe: id, data-prerrequisitos, click listener.
    //   6. Al final llama a G.dibujarLineas() y G.actualizarMallaYLineas().
    G.renderizarMallaDinamica = function(datosMalla) {
        // Si estamos en móvil y existe la función dedicada, delegar el renderizado
        if (window.innerWidth <= 768 && G.renderizarMallaMobile) {
            return G.renderizarMallaMobile(datosMalla);
        }

        const contenedor = document.getElementById('contenedor-malla');

        limpiarLineas();
        contenedor.innerHTML = '';

        // Actualizar título
        const nombreMalla = document.getElementById('input-nombre-malla').value.trim();
        if (nombreMalla) {
            document.getElementById('titulo-malla-pantalla').innerText = `Malla Curricular: ${nombreMalla}`;
        }

        // Agrupar por nivel
        const niveles = {};
        datosMalla.forEach(materia => {
            if (!niveles[materia.nivel]) niveles[materia.nivel] = [];
            niveles[materia.nivel].push(materia);
        });

        // Determinar etiqueta del periodo
        const tipoPeriodo = document.getElementById('select-tipo-periodo').value || 'Semestre';

        Object.keys(niveles).sort((a, b) => a - b).forEach(nivel => {
            const columna = document.createElement('div');
            columna.className = 'columna-nivel';

            const titulo = document.createElement('h3');
            titulo.innerText = `${tipoPeriodo} ${nivel}`;
            columna.appendChild(titulo);

            niveles[nivel].forEach(materia => {
                const tienePrereq = materia.prerrequisitos && materia.prerrequisitos.length > 0;
                const tarjeta = document.createElement('div');
                tarjeta.className = `tarjeta-materia ${tienePrereq ? 'bloqueada' : 'disponible'}`;
                tarjeta.id = materia.id;

                if (tienePrereq) {
                    tarjeta.setAttribute('data-prerrequisitos', JSON.stringify(materia.prerrequisitos));
                }

                tarjeta.innerHTML = `
                    <div class="encabezado-materia"><span>${window.escapeHTML(materia.id)}</span></div>
                    <div class="nombre-materia">${window.escapeHTML(materia.nombre)}</div>
                `;

                agregarClickTarjeta(tarjeta);
                columna.appendChild(tarjeta);
            });

            contenedor.appendChild(columna);

            // Drag desactivado
        });

        G.dibujarLineas(document.querySelectorAll('.tarjeta-materia'));
        G.actualizarMallaYLineas();
    }

    // ─────────────────────────────────────────────────────────────
}
