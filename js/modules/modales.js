// modales.js — se llama desde app.js pasando el namespace G
function initModales(G) {
    // ─────────────────────────────────────────────────────────────
    // MODAL PRINCIPAL — WIZARD DE 3 PASOS PARA CREAR MALLA
    // =============================================
    // Paso 1: Nombre de carrera + tipo de periodo + cantidad de periodos.
    // Paso 2: Cantidad de materias por periodo (inputs dinámicos).
    // Paso 3: Sigla, nombre y prerrequisitos de cada materia.
    // Al generar: renderiza la malla, guarda en localStorage y resetea progreso.
    //
    // irAPaso(activo, ...ocultos) → agrega clase "activo" a un paso
    //   y la quita de los demás (controla qué paso es visible).
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

    // Paso 1 → Paso 2
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

    // Paso 2 → Paso 1
    document.getElementById('btn-volver-paso').addEventListener('click', () => {
        irAPaso(paso1, paso2, paso3);
    });

    // Paso 2 → Paso 3
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

    // Manejador del dropdown de prerrequisitos dinámicos
    document.getElementById('contenedor-materias-dinamico').addEventListener('click', (e) => {
        if (e.target.classList.contains('input-prereq')) {
            const dropdown = e.target.nextElementSibling;
            const isVisible = dropdown.style.display === 'flex';
            
            // Ocultar todos primero
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

    // Cerrar dropdowns si se hace click fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.grupo-prereq')) {
            document.querySelectorAll('.prereq-dropdown').forEach(d => d.style.display = 'none');
        }
    });

    // Paso 3 → Paso 2
    document.getElementById('btn-volver-paso2').addEventListener('click', () => {
        irAPaso(paso2, paso1, paso3);
    });

    // Generar malla final
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
        localStorage.removeItem('aseac-progreso'); // reset progreso al cambiar malla
        localStorage.removeItem('aseac-horario');  // reset horario al cambiar malla
    });

    // =============================================
    // EXPORTAR / IMPORTAR MALLA
    // =============================================
    // La antigua lógica por texto/Base64 fue reemplazada por
    // js/core/backup.js que maneja respaldos de archivos .json con IndexedDB.
    // Los botones 'btn-exportar' y 'btn-importar' ahora son controlados 
    // directamente por backup.js


    // =============================================
    // REINICIAR PROGRESO
    // =============================================
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

    // =============================================

    // =============================================
    // BOTÓN Y MODAL — APOYAR PARA MI PASAJE :"( 
    // =============================================

    function crearModalApoyo() {
        // Inyectar modal en el body
        const modal = document.createElement('div');
        modal.id = 'modal-apoyo';
        modal.className = 'modal-fondo';
        modal.innerHTML = `
            <div class="modal-contenido apoyo-contenido">
                <div class="modal-header">
                    <h3>Sobre mi</h3>
                    <span class="cerrar-modal" id="btn-cerrar-apoyo">&times;</span>
                </div>

                <div class="apoyo-cuerpo">
                    <div class="apoyo-avatar">
                        <img src="avalgar.ico" alt="AVALGAR" class="apoyo-img">
                        <div>
                            <p class="apoyo-nombre">AVALGAR</p>
                            <p class="apoyo-desc">Desarrollador independiente de ASEAC</p>
                        </div>
                    </div>

                    <p class="apoyo-mensaje">
                        Les gusto o les fue util el proyecto ASEAC? Espero que si :) 
                        Una herramienta aun en dasarrollo, ya que faltan muchas funcionalidades
                        que me gustaria agregar, pero tambien soy un estudiante y la vez quiero seguir
                        aprendiendo, Gracias IA me ayudaste en la logica de algunas funciones.
                        Se imaginarán cuantos errores y bugs tuvo este proyecto. 
                        
                        psdta: Si son desarrolladores
                        organicen y separen funciones para que sea mas facil de entender y de mantener. 
                    </p>

                    <div class="apoyo-opciones">
                        <a class="apoyo-btn" href="https://www.tiktok.com/@avrzc1devsoc" target="_blank" rel="noopener">
                            TikTok 
                        </a>
                        <a class="apoyo-btn apoyo-btn-pasaje" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener">
                            Apoyame para poder conseguir un dominio
                        </a>
                        <button class="apoyo-btn apoyo-btn-qr" id="btn-mostrare-qr">
                            Quieres apoyarme para el desarrollo de ASEAC?
                        </button>
                    </div>

                    <div id="apoyo-qr-panel" class="apoyo-qr-panel oculto">
                        <p class="apoyo-qr-texto">Escanea para transferir o copia mi numero si eres de Bolivia:</p>
                        <div class="apoyo-qr-placeholder">
                            <span>[ mi qr ]</span>
                        </div>
                        <div class="apoyo-alias">
                            <span id="apoyo-alias-texto">id del banco</span>
                            <button id="btn-copiar-alias" class="btn-copiar"> Copiar</button>
                        </div>
                    </div>

                    <p class="apoyo-gracias">¡Gracias por usar ASEAC!</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Conectar con el botón de "Apóyame" en la navbar
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

        // Toggle QR panel
        const btnQR = document.getElementById('btn-mostrare-qr');
        if (btnQR) btnQR.addEventListener('click', () => {
            document.getElementById('apoyo-qr-panel').classList.toggle('oculto');
        });

        // Copiar alias
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

    // PWA — REGISTRAR SERVICE WORKER
    // =============================================
    let swRegistration = null;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                swRegistration = reg;
                console.log('ASEAC: Service Worker registrado');
            })
            .catch(err => console.warn('ASEAC: SW no disponible:', err));
    }

    // PWA - Solicitar Almacenamiento Persistente
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then(persistent => {
            if (persistent) {
                console.log("ASEAC: Almacenamiento concedido como PERSISTENTE.");
            } else {
                console.log("ASEAC: Almacenamiento VOLÁTIL (Sujeto a limpieza del OS visualizando falta de disco).");
            }
        });
    }

    // =============================================
    // SISTEMA DE NOTIFICACIONES — Aviso X minutos antes de clase
    // =============================================
    const MINUTOS_PREVIO = 15;
    let notifTimers  = [];
    let notifPermiso = false;

    async function pedirPermisoNotificaciones() {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied')  return false;
        const r = await Notification.requestPermission();
        return r === 'granted';
    }

    function enviarNotificacion(titulo, cuerpo) {
        if (!notifPermiso) return;
        const n = new Notification(titulo, {
            body: cuerpo,
            icon: 'avalgar.ico',
            badge: 'avalgar.ico',
            tag: titulo,
            renotify: true,
        });
        n.onclick = () => window.focus();
    }

    // --- Vía SW (background) o directa ---
    function enviarNotificacionConSW(titulo, cuerpo) {
        if (swRegistration?.active) {
            swRegistration.active.postMessage({
                tipo: 'PROGRAMAR_NOTIF', titulo, cuerpo, delay: 0
            });
        } else {
            enviarNotificacion(titulo, cuerpo);
        }
    }

    G.programarNotificacionesDiarias = function() {
        notifTimers.forEach(t => clearTimeout(t));
        notifTimers = [];

        if (!notifPermiso) return;
        if (Object.keys(G.bloquesPorCelda).length === 0) {
            G.mostrarToast('No hay clases cargadas en el horario.', 3000);
            return;
        }

        const ahora  = new Date();
        const diaHoy = ahora.getDay(); // 1=Lun...6=Sáb, 0=Dom
        if (diaHoy === 0) {
            G.mostrarToast('Hoy es domingo — sin clases programadas.', 3000);
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
            G.mostrarToast('No tienes clases hoy. Pero ... será?', 3000);
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
                        ` ${sigla} en ${MINUTOS_PREVIO} min`,
                        `Tu clase de ${sigla} empieza a las ${hora}. ¡Prepárate un cafe!`
                    );
                }, msPrevio);
                notifTimers.push(t);
                programadas++;
            }
        });

        if (programadas > 0) {
            G.mostrarToast(
                ` ${programadas} aviso${programadas > 1 ? 's' : ''} programado${programadas > 1 ? 's' : ''} — ${MINUTOS_PREVIO} min. antes de cada clase`,
                4500
            );
        } else {
            G.mostrarToast('ℹ Todas tus clases de hoy ya comenzaron.', 3000);
        }
    }

    function crearBotonNotificaciones() {
        const btn = document.createElement('button');
        btn.id = 'btn-notif';
        btn.className = 'nav-util-btn nav-btn nav-btn--ghost';
        btn.setAttribute('data-tip', 'Activar notificaciones');
        btn.innerHTML = '🔕';

        const utils = document.getElementById('nav-utilidades') || document.querySelector('.acciones-malla');
        utils.appendChild(btn);

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
                G.programarNotificacionesDiarias();
                return;
            }
            const ok = await pedirPermisoNotificaciones();
            notifPermiso = ok;
            actualizarEstadoBtn();
            if (ok) {
                G.mostrarToast('Notificaciones activadas. Abre el horario para programarlas.', 4000);
            } else {
                G.mostrarToast('Permiso denegado. Actívalas desde la configuración del navegador.', 5000);
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

    // Reprogramar notificaciones cada vez que se cierra el modal de horario
    document.getElementById('btn-cerrar-horario').addEventListener('click', () => {
        document.getElementById('modal-horario').style.display = 'none';
        G.programarNotificacionesDiarias();
    });

    // También programar cuando se limpia el horario
    const _btnLimpiarOriginal = document.getElementById('btn-limpiar-horario');
    _btnLimpiarOriginal.addEventListener('click', () => {
        setTimeout(G.programarNotificacionesDiarias, 100);
    });

    crearBotonNotificaciones();


    // =========================================================
    // MÓDULO 1: EXPORTAR PDF
    // ─────────────────────────────────────────────────────────
    // Captura el grid del horario activo usando html2canvas y genera un PDF.
    // =========================================================
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
