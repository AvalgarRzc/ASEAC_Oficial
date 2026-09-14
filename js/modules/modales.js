function initModales(G) {

    const modalMalla   = document.getElementById('modal-malla');
    const btnAbrir     = document.getElementById('btn-abrir-modal');
    const btnCerrar    = document.getElementById('btn-cerrar-modal');
    const paso1        = document.getElementById('modal-paso-1');
    const paso2        = document.getElementById('modal-paso-2');
    const paso3        = document.getElementById('modal-paso-3');

    function irAPaso(activo, ...ocultos) {
        ocultos.forEach(p => p.classList.remove('activo'));
        activo.classList.add('activo');
    }

    btnAbrir.addEventListener('click', () => {
        modalMalla.style.display = 'flex';
    });

    btnCerrar.addEventListener('click', () => {
        modalMalla.style.display = 'none';
        irAPaso(paso1, paso2, paso3);
    });

    document.getElementById('btn-siguiente-paso').addEventListener('click', () => {
        const tipoPeriodo    = document.getElementById('select-tipo-periodo').value;
        const cantidadPeriodos = parseInt(document.getElementById('input-cantidad-periodos').value);
        if (!cantidadPeriodos || cantidadPeriodos < 1) return;

        document.getElementById('texto-instruccion-paso2').innerText =
            `Define la cantidad de materias para cada ${tipoPeriodo.toLowerCase()}:`;

        const contenedorDinamico = document.getElementById('contenedor-periodos-dinamico');
        contenedorDinamico.innerHTML = '';

        for (let i = 1; i <= cantidadPeriodos; i++) {
            const div = document.createElement('div');
            div.className = 'fila-inputs';
            div.style.cssText = 'margin-bottom:15px; align-items:center;';
            div.innerHTML = `
                <label style="flex:2; color:var(--color-disponible); font-weight:bold;">${tipoPeriodo} ${i}</label>
                <div class="grupo-input" style="flex:1; margin-bottom:0;">
                    <input type="number" min="1" max="10" value="5"
                            class="input-materias-periodo" data-periodo="${i}">
                </div>
            `;
            contenedorDinamico.appendChild(div);
        }

        irAPaso(paso2, paso1, paso3);
    });

    document.getElementById('btn-volver-paso').addEventListener('click', () => {
        irAPaso(paso1, paso2, paso3);
    });

    document.getElementById('btn-configurar-materias').addEventListener('click', () => {
        const tipoPeriodo = document.getElementById('select-tipo-periodo').value;
        const contenedorMaterias = document.getElementById('contenedor-materias-dinamico');
        contenedorMaterias.innerHTML = '';

        document.querySelectorAll('.input-materias-periodo').forEach(input => {
            const periodo  = parseInt(input.getAttribute('data-periodo'));
            const cantidad = parseInt(input.value);

            const titulo = document.createElement('h4');
            titulo.className = 'titulo-periodo-dinamico';
            titulo.innerText = `${tipoPeriodo} ${periodo}`;
            contenedorMaterias.appendChild(titulo);

            for (let i = 1; i <= cantidad; i++) {
                const div = document.createElement('div');
                div.className = 'tarjeta-input-materia';
                div.innerHTML = `
                    <div class="fila-inputs" style="margin-bottom:10px;">
                        <div class="grupo-input" style="flex:1; margin-bottom:0;">
                            <label>Sigla (ID)</label>
                            <input type="text" class="input-pequeno input-sigla"
                                    placeholder="Ej: SIS-111" data-periodo="${periodo}">
                        </div>
                        <div class="grupo-input" style="flex:2; margin-bottom:0;">
                            <label>Nombre de la Materia</label>
                            <input type="text" class="input-pequeno input-nombre"
                                    placeholder="Ej: Programación I">
                        </div>
                    </div>
                    <div class="grupo-input grupo-prereq" style="margin-bottom:0; position:relative;">
                        <label>Prerrequisitos (Separadas por comas o click para desplegar)</label>
                        <input type="text" class="input-pequeno input-prereq"
                                placeholder="Ej: SIS-111 (click para seleccionar)" autocomplete="off">
                        <div class="prereq-dropdown oculto" style="position:absolute; top:100%; left:0; width:100%; background:var(--carbon-columna); border:1px solid var(--carbon-tarjeta); z-index:10; border-radius:6px; padding:8px; max-height:160px; overflow-y:auto; display:none; flex-direction:column; gap:6px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                        </div>
                    </div>
                `;
                contenedorMaterias.appendChild(div);
            }
        });

        irAPaso(paso3, paso1, paso2);
    });

    document.getElementById('contenedor-materias-dinamico').addEventListener('click', (e) => {
        if (e.target.classList.contains('input-prereq')) {
            const dropdown = e.target.nextElementSibling;
            const isVisible = dropdown.style.display === 'flex';

            document.querySelectorAll('.prereq-dropdown').forEach(d => d.style.display = 'none');

            if (!isVisible) {
                dropdown.style.display = 'flex';
                dropdown.innerHTML = ''; 

                const currentPeriod = parseInt(e.target.closest('.tarjeta-input-materia').querySelector('.input-sigla').getAttribute('data-periodo'));

                const allSiglasInputs = document.querySelectorAll('.input-sigla');
                let availableSiglas = [];
                allSiglasInputs.forEach(inp => {
                    const p = parseInt(inp.getAttribute('data-periodo'));
                    const val = inp.value.trim().toUpperCase();
                    if (p < currentPeriod && val) {
                        availableSiglas.push(val);
                    }
                });

                if (availableSiglas.length === 0) {
                    dropdown.innerHTML = '<span style="color:#64748b; font-size:0.85em; padding:4px;">No hay materias de periodos previos.</span>';
                } else {
                    const currentSelected = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

                    availableSiglas.forEach(sigla => {
                        const lbl = document.createElement('label');
                        lbl.className = 'prereq-item';

                        const chk = document.createElement('input');
                        chk.className = 'prereq-checkbox';
                        chk.type = 'checkbox';
                        chk.value = sigla;
                        if (currentSelected.includes(sigla)) chk.checked = true;

                        chk.addEventListener('change', () => {
                            let selected = e.target.value ? e.target.value.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean) : [];
                            if (chk.checked) {
                                if (!selected.includes(sigla)) selected.push(sigla);
                            } else {
                                selected = selected.filter(s => s !== sigla);
                            }
                            e.target.value = selected.join(', ');
                        });

                        lbl.appendChild(chk);
                        lbl.appendChild(document.createTextNode(sigla));
                        dropdown.appendChild(lbl);
                    });
                }
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.grupo-prereq')) {
            document.querySelectorAll('.prereq-dropdown').forEach(d => d.style.display = 'none');
        }
    });

    document.getElementById('btn-volver-paso2').addEventListener('click', () => {
        irAPaso(paso2, paso1, paso3);
    });

    document.getElementById('btn-generar-malla-final').addEventListener('click', () => {
        const datos = [];

        document.querySelectorAll('.tarjeta-input-materia').forEach(tarjeta => {
            const sigla   = tarjeta.querySelector('.input-sigla').value.trim().toUpperCase();
            const nombre  = tarjeta.querySelector('.input-nombre').value.trim();
            const periodo = parseInt(tarjeta.querySelector('.input-sigla').getAttribute('data-periodo'));
            const prereqRaw = tarjeta.querySelector('.input-prereq').value.trim();

            if (!sigla || !nombre) return;

            const prerrequisitos = prereqRaw
                ? prereqRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                : [];

            datos.push({ id: sigla, nombre, nivel: periodo, prerrequisitos });
        });

        if (datos.length === 0) {
            alert('No hay materias válidas. Completa al menos una sigla y nombre.');
            return;
        }

        G.mallaActualEnPantalla = datos;
        modalMalla.style.display = 'none';
        irAPaso(paso1, paso2, paso3);
        G.renderizarMallaDinamica(datos);
        const nomMalla  = document.getElementById('input-nombre-malla').value.trim();
        const tipoPer   = document.getElementById('select-tipo-periodo').value;
        G.guardarMalla(datos, nomMalla, tipoPer);
        localStorage.removeItem('aseac-progreso'); 
        localStorage.removeItem('aseac-horario');  
    });

    document.getElementById('btn-reiniciar').addEventListener('click', () => {
        if (!confirm('¿Reiniciar progreso? Todas las materias volverán a su estado inicial.')) return;

        document.querySelectorAll('.tarjeta-materia').forEach(tarjeta => {
            tarjeta.classList.remove('aprobada');
            const reqAttr = tarjeta.getAttribute('data-prerrequisitos');
            const tienePrereq = reqAttr && JSON.parse(reqAttr).length > 0;

            if (tienePrereq) {
                tarjeta.classList.remove('disponible');
                tarjeta.classList.add('bloqueada');
            } else {
                tarjeta.classList.remove('bloqueada');
                tarjeta.classList.add('disponible');
            }
        });

        G.actualizarMallaYLineas();
        localStorage.removeItem(G.SK.progreso);
    });

    function crearModalApoyo() {

        const modal = document.createElement('div');
        modal.id = 'modal-apoyo';
        modal.className = 'modal-fondo';
        modal.innerHTML = `
            <div class="modal-contenido apoyo-contenido">
                <div class="modal-header apoyo-header">
                    <div class="apoyo-brand">
                        <img src="logo avrzc web.png" alt="ASEAC" class="apoyo-logo-head" onerror="this.style.display='none'">
                        <div class="apoyo-brand-info">
                            <span class="apoyo-badge">PROYECTO INDEPENDIENTE</span>
                            <h3 class="apoyo-titulo-principal">ASEAC <span class="apoyo-titulo-sub">A-RZC</span></h3>
                        </div>
                    </div>
                    <span class="cerrar-modal" id="btn-cerrar-apoyo">&times;</span>
                </div>

                <div class="apoyo-cuerpo">
                    <div class="apoyo-avatar">
                        <img src="avalgar.ico" alt="AVALGAR" class="apoyo-img">
                        <div class="apoyo-avatar-meta">
                            <p class="apoyo-nombre">AVALGAR</p>
                            <p class="apoyo-desc">Creador y Desarrollador de <strong>ASEAC</strong></p>
                        </div>
                    </div>

                    <div class="apoyo-mensaje-card">
                        <p class="apoyo-mensaje-titulo">¿Te ha sido útil el proyecto <strong>ASEAC</strong>?</p>
                        <p class="apoyo-mensaje">
                            ASEAC es una herramienta universitaria creada para ayudarte a organizar tu avance académico y planificar tu carrera. Como estudiante y desarrollador independiente, sigo construyendo nuevas funcionalidades para mejorar tu experiencia.
                        </p>
                        <p class="apoyo-nota">
                            💡 <em>P.D. para devs: Organicen y separen bien las funciones para un código limpio y fácil de mantener.</em>
                        </p>
                    </div>

                    <div class="apoyo-opciones">
                        <a class="apoyo-btn apoyo-btn-tiktok" href="https://www.tiktok.com/@avrzc1devsoc" target="_blank" rel="noopener">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.83V7.5a6.34 6.34 0 0 0-6.16 6.34 6.34 0 0 0 10.79 4.49 6.34 6.34 0 0 0 1.73-4.49V9.4a8.16 8.16 0 0 0 4.75 1.54V7.5a4.85 4.85 0 0 1-1-.81z"/></svg>
                            <span>Sígueme en TikTok</span>
                        </a>
                        <a class="apoyo-btn apoyo-btn-pasaje" href="https://www.tiktok.com/@avrzc1devsoc" target="_blank" rel="noopener">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            <span>Apoyar para el Dominio Web</span>
                        </a>
                        <button class="apoyo-btn apoyo-btn-qr" id="btn-mostrare-qr">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                            <span>Apoyar al desarrollo de ASEAC (QR / Bolivia)</span>
                        </button>
                    </div>

                    <div id="apoyo-qr-panel" class="apoyo-qr-panel oculto">
                        <p class="apoyo-qr-texto">Escanea para transferir o copia el número de cuenta (Bolivia):</p>
                        <div class="apoyo-qr-placeholder">
                            <span>[ Código QR ]</span>
                        </div>
                        <div class="apoyo-alias">
                            <span id="apoyo-alias-texto">id del banco</span>
                            <button id="btn-copiar-alias" class="btn-copiar">Copiar ID</button>
                        </div>
                    </div>

                    <p class="apoyo-gracias">¡Gracias por usar y apoyar el proyecto <strong>ASEAC</strong>!</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const btnApoyo = document.querySelector('.btn-apoyame');
        if (btnApoyo) {
            btnApoyo.addEventListener('click', () => {
                modal.style.display = 'flex';
            });
        }

        document.getElementById('btn-cerrar-apoyo').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        const btnQR = document.getElementById('btn-mostrare-qr');
        if (btnQR) btnQR.addEventListener('click', () => {
            document.getElementById('apoyo-qr-panel').classList.toggle('oculto');
        });

        document.getElementById('btn-copiar-alias').addEventListener('click', () => {
            const alias = document.getElementById('apoyo-alias-texto').innerText;
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(alias).then(() => {
                    const btn = document.getElementById('btn-copiar-alias');
                    btn.innerText = 'Copiado';
                    setTimeout(() => btn.innerText = 'Copiar', 2000);
                });
            } else {
                prompt('Copia el alias:', alias);
            }
        });
    }

    crearModalApoyo();

    let swRegistration = window.swRegistration || null;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then(reg => {
                swRegistration = reg;
                window.swRegistration = reg;
            })
            .catch(() => {});
    }

    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist();
    }

    const MINUTOS_PREVIO = 15;
    let notifTimers  = [];
    let notifPermiso = false;

    async function pedirPermisoNotificaciones() {
        if (!('Notification' in window)) return false;

        const esIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
        const esPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        if (esIOS && !esPWA) {
            G.mostrarToast('En iPhone/iPad, primero instala ASEAC en tu pantalla de inicio para recibir notificaciones.', 5000);
            return false;
        }

        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied')  return false;
        const r = await Notification.requestPermission();
        return r === 'granted';
    }

    async function enviarNotificacionConSW(titulo, cuerpo) {
        if (!notifPermiso && Notification.permission !== 'granted') return;

        try {

            const reg = swRegistration || (await navigator.serviceWorker?.ready);
            if (reg?.showNotification) {
                await reg.showNotification(titulo, {
                    body: cuerpo,
                    icon: './icon-192.png',
                    badge: './icon-192.png',
                    tag: titulo,
                    renotify: true,
                    vibrate: [200, 100, 200]
                });
                return;
            }

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(titulo, {
                    body: cuerpo,
                    icon: './icon-192.png',
                    tag: titulo,
                    renotify: true
                });
            }
        } catch (err) {
            console.warn('[Notificaciones] Error al emitir:', err);
        }
    }

    G.enviarNotificacion = enviarNotificacionConSW;

    G.programarNotificacionesDiarias = function(silencioso = false) {
        notifTimers.forEach(t => clearTimeout(t));
        notifTimers = [];

        if (Notification.permission !== 'granted') return;
        notifPermiso = true;

        if (Object.keys(G.bloquesPorCelda).length === 0) {
            if (!silencioso) G.mostrarToast('No hay clases cargadas en el horario.', 3000);
            return;
        }

        const ahora  = new Date();
        const diaHoy = ahora.getDay(); 
        if (diaHoy === 0) {
            if (!silencioso) G.mostrarToast('Hoy es domingo — sin clases programadas.', 3000);
            return;
        }

        const iniciosPorMateria = {};
        Object.entries(G.bloquesPorCelda).forEach(([key, sigla]) => {
            const [dia, hora] = key.split('-');
            if (parseInt(dia) !== diaHoy) return;
            if (!iniciosPorMateria[sigla] || hora < iniciosPorMateria[sigla]) {
                iniciosPorMateria[sigla] = hora;
            }
        });

        const totalMaterias = Object.keys(iniciosPorMateria).length;
        if (totalMaterias === 0) {
            if (!silencioso) G.mostrarToast('No tienes clases registradas para hoy.', 3000);
            return;
        }

        let programadas = 0;

        Object.entries(iniciosPorMateria).forEach(([sigla, hora]) => {
            const [h, m] = hora.split(':').map(Number);
            const inicio  = new Date(); inicio.setHours(h, m, 0, 0);
            const previo  = new Date(inicio.getTime() - MINUTOS_PREVIO * 60000);
            const msPrevio = previo - ahora;

            if (msPrevio > 0) {

                const t = setTimeout(() => {
                    enviarNotificacionConSW(
                        `⏰ ${sigla} en ${MINUTOS_PREVIO} min`,
                        `Tu clase de ${sigla} empieza a las ${hora}. ¡Prepárate un café!`
                    );
                }, msPrevio);
                notifTimers.push(t);
                programadas++;
            } else if (ahora < inicio) {

                const minRestantes = Math.max(1, Math.ceil((inicio - ahora) / 60000));
                enviarNotificacionConSW(
                    `⏰ ${sigla} empieza pronto`,
                    `Tu clase de ${sigla} empieza a las ${hora} (en ${minRestantes} min).`
                );
                programadas++;
            }
        });

        if (!silencioso) {
            if (programadas > 0) {
                G.mostrarToast(
                    `🔔 ${programadas} aviso${programadas > 1 ? 's' : ''} programado${programadas > 1 ? 's' : ''} — ${MINUTOS_PREVIO} min antes de cada clase`,
                    4500
                );
            } else {
                G.mostrarToast('ℹ Todas tus clases de hoy ya comenzaron.', 3000);
            }
        }
    };

    function crearBotonNotificaciones() {
        const btn = document.createElement('button');
        btn.id = 'btn-notif';
        btn.className = 'nav-util-btn nav-btn nav-btn--ghost';
        btn.setAttribute('data-tip', 'Activar notificaciones');
        btn.innerHTML = '🔕';

        const utils = document.getElementById('nav-utilidades') || document.querySelector('.acciones-malla');
        if (utils) utils.appendChild(btn);

        async function actualizarEstadoBtn() {
            if (Notification.permission === 'granted') {
                notifPermiso = true;
                btn.innerHTML = '🔔';
                btn.setAttribute('data-tip', 'Notificaciones activas');
                btn.classList.add('notif-activa');
            } else {
                notifPermiso = false;
                btn.innerHTML = '🔕';
                btn.setAttribute('data-tip', 'Activar notificaciones');
                btn.classList.remove('notif-activa');
            }
        }

        btn.addEventListener('click', async () => {
            if (Notification.permission === 'granted') {
                notifPermiso = true;
                G.programarNotificacionesDiarias(false);
                return;
            }
            const ok = await pedirPermisoNotificaciones();
            notifPermiso = ok;
            actualizarEstadoBtn();
            if (ok) {
                G.mostrarToast('Notificaciones activadas.', 3000);
                G.programarNotificacionesDiarias(false);
            } else {
                G.mostrarToast('Permiso no concedido. Actívalo en la configuración del navegador.', 5000);
            }
        });

        actualizarEstadoBtn();
    }

    G.mostrarToast = function(mensaje, duracion = 3000) {
        let toast = document.getElementById('aseac-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'aseac-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = mensaje;
        toast.classList.add('visible');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('visible'), duracion);
    }

    document.getElementById('btn-cerrar-horario').addEventListener('click', () => {
        document.getElementById('modal-horario').style.display = 'none';
        G.programarNotificacionesDiarias();
    });

    const _btnLimpiarOriginal = document.getElementById('btn-limpiar-horario');
    _btnLimpiarOriginal.addEventListener('click', () => {
        setTimeout(G.programarNotificacionesDiarias, 100);
    });

    crearBotonNotificaciones();

    document.getElementById('btn-exportar-pdf').addEventListener('click', async function() {
        const btn = this;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>...</span>';
        try {
            const grid = document.querySelector('.grid-turno.activo') || document.getElementById('grid-manana');
            if (!grid) { G.mostrarToast('Abre el horario primero'); return; }
            const canvas = await html2canvas(grid, { backgroundColor:'#1a1a1e', scale:2, useCORS:true, logging:false });
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
            const titulo = document.getElementById('titulo-malla-pantalla').innerText;
            pdf.setFontSize(13); pdf.setTextColor(30,30,30);
            pdf.text('Horario Semanal - ASEAC', 148, 14, {align:'center'});
            pdf.setFontSize(8); pdf.setTextColor(100,100,100);
            pdf.text(titulo, 148, 20, {align:'center'});
            const imgW = 277;
            const imgH = Math.min((canvas.height * imgW) / canvas.width, 170);
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 26, imgW, imgH);
            pdf.save('horario-aseac.pdf');
            G.mostrarToast('PDF descargado');
        } catch(err) {
            console.error(err);
            G.mostrarToast('Error al generar PDF');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-file-pdf"></i><span>PDF</span>';
        }
    });
}
