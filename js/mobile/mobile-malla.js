function initMobileMalla(G) {
    if (!G) return;

    G.actualizarMiniProgreso = function() {
        document.querySelectorAll('.mobile-accordion-group').forEach(group => {
            const total    = group.querySelectorAll('.tarjeta-materia').length;
            const aprobadas = group.querySelectorAll('.tarjeta-materia.aprobada').length;
            const pct = total === 0 ? 0 : Math.round((aprobadas / total) * 100);

            const counter = group.querySelector('.mob-year-counter');
            const bar     = group.querySelector('.mob-year-bar-fill');
            if (counter) counter.textContent = `${aprobadas}/${total}`;
            if (bar)     bar.style.width = pct + '%';
        });
    };

    G.renderizarMallaMobile = function(datosMalla) {
        const contenedor = document.getElementById('contenedor-malla');

        if (G.lineasConexion) {
            G.lineasConexion.forEach(c => c.linea && c.linea.remove());
            G.lineasConexion.length = 0;
        }

        contenedor.innerHTML = '';

        const nombreMalla = document.getElementById('input-nombre-malla').value.trim();
        if (nombreMalla) {
            document.getElementById('titulo-malla-pantalla').innerText = `Malla: ${nombreMalla}`;
        }

        const tipoPeriodo = document.getElementById('select-tipo-periodo').value || 'Semestre';
        const esSemestral = tipoPeriodo.toLowerCase() === 'semestre';
        const porAño      = {};

        datosMalla.forEach(materia => {
            const numAno = esSemestral ? Math.ceil(materia.nivel / 2) : materia.nivel;
            if (!porAño[numAno]) porAño[numAno] = [];
            porAño[numAno].push(materia);
        });

        Object.keys(porAño).sort((a, b) => a - b).forEach(ano => {
            const materiasDeLAno = porAño[ano];

            const accGroup = document.createElement('div');
            accGroup.className = 'mobile-accordion-group';
            accGroup.dataset.ano = ano;

            const header = document.createElement('div');
            header.className = 'mobile-accordion-header active';
            header.innerHTML = `
                <div class="mob-year-left">
                    <div class="mob-year-badge">Año ${ano}</div>
                    <div class="mob-year-progress">
                        <div class="mob-year-bar"><div class="mob-year-bar-fill"></div></div>
                        <span class="mob-year-counter">0/${materiasDeLAno.length}</span>
                    </div>
                </div>
                <i class="fas fa-chevron-down mob-chevron"></i>
            `;

            const content = document.createElement('div');
            content.className = 'mobile-accordion-content';
            content.style.maxHeight = 'none'; 

            const gridYear = document.createElement('div');
            gridYear.className = 'mobile-year-grid';

            if (esSemestral) {
                const semImpar = ano * 2 - 1;
                const semPar   = ano * 2;

                const col1 = document.createElement('div');
                col1.className = 'mobile-semester-col';
                col1.innerHTML = `<div class="mobile-semester-title"><i class="fas fa-circle-dot"></i> ${tipoPeriodo} ${semImpar}</div>`;

                const col2 = document.createElement('div');
                col2.className = 'mobile-semester-col';
                col2.innerHTML = `<div class="mobile-semester-title"><i class="fas fa-circle-dot"></i> ${tipoPeriodo} ${semPar}</div>`;

                materiasDeLAno.forEach(materia => {
                    const tarjeta = _crearTarjeta(materia);
                    (materia.nivel % 2 !== 0 ? col1 : col2).appendChild(tarjeta);
                });

                gridYear.appendChild(col1);
                gridYear.appendChild(col2);
            } else {

                const colUnica = document.createElement('div');
                colUnica.className = 'mobile-semester-col mobile-semester-col--full';
                materiasDeLAno.forEach(m => colUnica.appendChild(_crearTarjeta(m)));
                gridYear.appendChild(colUnica);
            }

            content.appendChild(gridYear);

            header.addEventListener('click', () => {
                const abierto = header.classList.contains('active');
                if (abierto) {

                    content.style.maxHeight = content.scrollHeight + 'px';
                    void content.offsetHeight; 
                    header.classList.remove('active');
                    content.style.maxHeight = '0px';
                } else {

                    header.classList.add('active');
                    content.style.maxHeight = (content.scrollHeight + 60) + 'px';
                    setTimeout(() => {
                        if (header.classList.contains('active')) {
                            content.style.maxHeight = 'none';
                        }
                    }, 360);
                }
            });

            accGroup.appendChild(header);
            accGroup.appendChild(content);
            contenedor.appendChild(accGroup);
        });

        G.actualizarMallaYLineas();

        setTimeout(() => {
            G.actualizarMiniProgreso();
        }, 50);
    };

    function _crearTarjeta(materia) {
        const tienePrereq = materia.prerrequisitos && materia.prerrequisitos.length > 0;

        const tarjeta = document.createElement('div');
        tarjeta.className = `tarjeta-materia ${tienePrereq ? 'bloqueada' : 'disponible'}`;
        tarjeta.id = materia.id;

        if (tienePrereq) {
            tarjeta.setAttribute('data-prerrequisitos', JSON.stringify(materia.prerrequisitos));
        }

        const idEsc     = window.escapeHTML ? window.escapeHTML(materia.id)     : materia.id;
        const nombreEsc = window.escapeHTML ? window.escapeHTML(materia.nombre) : materia.nombre;

        tarjeta.innerHTML = `
            <div class="encabezado-materia"><span>${idEsc}</span></div>
            <div class="nombre-materia">${nombreEsc}</div>
            <div class="mob-card-status-dot"></div>
        `;

        tarjeta.addEventListener('click', function () {
            if (this.classList.contains('bloqueada')) return;
            if (this.classList.contains('aprobada')) {
                this.classList.replace('aprobada', 'disponible');
            } else {
                this.classList.replace('disponible', 'aprobada');
            }

            G.actualizarMallaYLineas();
            G.actualizarMiniProgreso();
            if (G.guardarProgreso) G.guardarProgreso();
            if (document.getElementById('modal-horario').style.display === 'flex' && G.cargarMateriasEnPanelHorario) {
                G.cargarMateriasEnPanelHorario();
            }
        });

        return tarjeta;
    }
}
