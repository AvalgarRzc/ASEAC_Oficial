function initMalla(G) {

    G.dibujarLineas = function(tarjetas) {

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

    function limpiarLineas() {
        G.lineasConexion.forEach(c => c.linea && c.linea.remove());
        G.lineasConexion.length = 0;
    }

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
                    size: 2,
                    dash: false,
                    dropShadow: false
                });
            } else {
                linea.setOptions({
                    color: G.colorLineaInactiva,
                    size: 1.5,
                    dash: { animation: true },
                    dropShadow: false
                });
            }
        });

        const totalMaterias = tarjetasActuales.length;
        const cantAprobadas = aprobadas.length;
        const cantRestantes = totalMaterias - cantAprobadas;
        const porcentaje = totalMaterias === 0 ? 0 : Math.round((cantAprobadas / totalMaterias) * 100);

        const statAprobadas  = document.getElementById('stat-aprobadas');
        const statRestantes  = document.getElementById('stat-disponibles');
        const statTotal      = document.getElementById('stat-total');
        const statPorcentaje = document.getElementById('stat-porcentaje');
        const barraFill = document.getElementById('barra-progreso-fill');

        if (statAprobadas) statAprobadas.textContent = cantAprobadas;
        if (statRestantes) statRestantes.textContent = cantRestantes;
        if (statTotal) statTotal.textContent = totalMaterias;
        if (statPorcentaje) statPorcentaje.textContent = porcentaje + '%';
        if (barraFill) barraFill.style.width = porcentaje + '%';
    }

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

            if (document.getElementById('modal-horario').style.display === 'flex') {
                G.cargarMateriasEnPanelHorario();
            }
        });
    }

    document.querySelectorAll('.tarjeta-materia').forEach(agregarClickTarjeta);
    G.dibujarLineas(document.querySelectorAll('.tarjeta-materia'));

    G.reposicionarLineas = function() {
        G.lineasConexion.forEach(c => {
            try { c.linea.position(); } catch(e) {}
        });
    }

    let resizeTimer;
    let eraMovilAntes = window.innerWidth <= 768;

    function adaptarAMedidaPantalla() {
        const esMovilAhora = window.innerWidth <= 768;
        if (esMovilAhora !== eraMovilAntes) {
            eraMovilAntes = esMovilAhora;

            if (G.mallaActualEnPantalla && G.mallaActualEnPantalla.length > 0) {
                G.renderizarMallaDinamica(G.mallaActualEnPantalla);
            }
        } else {

            if (!esMovilAhora) {
                G.reposicionarLineas();
            }
        }
    }

    const mqlMobile = window.matchMedia('(max-width: 768px)');
    if (mqlMobile.addEventListener) {
        mqlMobile.addEventListener('change', adaptarAMedidaPantalla);
    } else if (mqlMobile.addListener) {
        mqlMobile.addListener(adaptarAMedidaPantalla);
    }

    window.addEventListener('resize', () => {
        const esMovilAhora = window.innerWidth <= 768;
        if (esMovilAhora !== eraMovilAntes) {
            clearTimeout(resizeTimer);
            adaptarAMedidaPantalla();
            return;
        }

        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            adaptarAMedidaPantalla();
        }, 40);
    });

    const contenedorMalla = document.getElementById('contenedor-malla');
    if (contenedorMalla) {
        contenedorMalla.addEventListener('scroll',    G.reposicionarLineas);
        contenedorMalla.addEventListener('touchmove', G.reposicionarLineas, { passive: true });
        contenedorMalla.addEventListener('touchend',  G.reposicionarLineas, { passive: true });
    }

    window.addEventListener('scroll', G.reposicionarLineas, { passive: true });

    window.addEventListener('orientationchange', () => {
        setTimeout(adaptarAMedidaPantalla, 100);
    });

    G.renderizarMallaDinamica = function(datosMalla) {

        if (window.innerWidth <= 768 && G.renderizarMallaMobile) {
            return G.renderizarMallaMobile(datosMalla);
        }

        const contenedor = document.getElementById('contenedor-malla');

        limpiarLineas();
        contenedor.innerHTML = '';

        const nombreMalla = document.getElementById('input-nombre-malla').value.trim();
        if (nombreMalla) {
            document.getElementById('titulo-malla-pantalla').innerText = `Malla Curricular: ${nombreMalla}`;
        }

        const niveles = {};
        datosMalla.forEach(materia => {
            if (!niveles[materia.nivel]) niveles[materia.nivel] = [];
            niveles[materia.nivel].push(materia);
        });

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

        });

        G.dibujarLineas(document.querySelectorAll('.tarjeta-materia'));
        G.actualizarMallaYLineas();
    }

}
