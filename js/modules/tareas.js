// tareas.js — se llama desde app.js pasando el namespace G
function initTareas(G) {
    // ─────────────────────────────────────────────────────────────
    // MÓDULO 2: TAREAS Y PARCIALES — CALENDARIO INTERACTIVO
    // ─────────────────────────────────────────────────────────
    // IIFE que encapsula todo el módulo de calendario y eventos.
    //
    // ESTADO INTERNO:
    //   · eventos   → objeto { "YYYY-MM-DD": [{id, hora, tipo, materia, desc}] }
    //   · diaActivo → clave del día seleccionado actualmente
    //   · navY/navM → año y mes navegados actualmente
    //
    // FUNCIONES PRINCIPALES:
    //   · renderCal()      → pinta el grid del mes con celdas, punto de evento,
    //                        clase "hoy" y clase "seleccionado"
    //   · renderDia()      → muestra los eventos del día activo en el panel derecho
    //   · renderProximas() → muestra los próximos 6 eventos futuros ordenados por fecha
    //
    // SELECTORES MES/AÑO: pobla los <select> de mes y año al abrir el modal.
    //   Cambiar la selección llama a renderCal() para navegar.
    //
    // GUARDAR EVENTO: valida campos, agrega al objeto eventos[], persiste
    //   en localStorage "aseac-eventos", y programa notificación si el evento
    //   es mañana y hay permiso de Notification.
    //
    // ELIMINAR EVENTO: window.__evDel(key,id) es accesible desde los botones
    //   de basura renderizados en el HTML dinámico.
    // =========================================================
    (function() {
        const modal     = document.getElementById('modal-tareas');
        const btnAbrir  = document.getElementById('btn-abrir-tareas');
        const btnCerrar = document.getElementById('btn-cerrar-tareas');

        const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const EMOJIS = {tarea:'📝', parcial:'📋', proyecto:'💼', examen:'🎯'};
        const HOY    = new Date();

        let eventos   = {};
        let diaActivo = null;
        let navY = HOY.getFullYear();
        let navM = HOY.getMonth();

        // ─────────────────────────────────────────────────────────────
        // CASCADE MATERIA: puebla el <select> con las materias de la
        // malla activa, agrupadas por semestre/periodo.
        // Delegado a la utilidad global en utils.js
        // ─────────────────────────────────────────────────────────────
        function poblarSelectMateria() {
            const sel = document.getElementById('ev-materia');
            if (G.poblarSelectorMaterias) {
                G.poblarSelectorMaterias(sel, '<option value="" disabled selected>— Selecciona una materia —</option>', true);
            }
        }

        // Poblar selects de mes y año
        const selMes = document.getElementById('cal-mes-select');
        const selAno = document.getElementById('cal-ano-select');
        MESES.forEach((m, i) => {
            const o = document.createElement('option');
            o.value = i; o.textContent = m;
            selMes.appendChild(o);
        });
        for (let y = HOY.getFullYear() - 2; y <= HOY.getFullYear() + 5; y++) {
            const o = document.createElement('option');
            o.value = y; o.textContent = y;
            selAno.appendChild(o);
        }
        selMes.value = navM;
        selAno.value = navY;

        selMes.addEventListener('change', () => { navM = parseInt(selMes.value); renderCal(); });
        selAno.addEventListener('change', () => { navY = parseInt(selAno.value); renderCal(); });

        const toKey = (y,m,d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const cargar = () => { try { eventos = JSON.parse(localStorage.getItem('aseac-eventos')||'{}'); } catch(e) { eventos={}; } };
        const guardar = () => localStorage.setItem('aseac-eventos', JSON.stringify(eventos));

        function renderCal() {
            selMes.value = navM;
            selAno.value = navY;
            const grid = document.getElementById('cal-grid');
            grid.innerHTML = '';
            const primer = new Date(navY, navM, 1).getDay();
            const total  = new Date(navY, navM+1, 0).getDate();
            const hoy    = new Date();

            for (let i=0; i<primer; i++) {
                const v = document.createElement('div');
                v.className = 'cal-celda vacia';
                grid.appendChild(v);
            }
            for (let d=1; d<=total; d++) {
                const key  = toKey(navY, navM, d);
                const cell = document.createElement('div');
                cell.className = 'cal-celda';
                cell.dataset.key = key;
                const esHoy = hoy.getFullYear()===navY && hoy.getMonth()===navM && hoy.getDate()===d;
                if (esHoy)           cell.classList.add('hoy');
                if (diaActivo===key) cell.classList.add('seleccionado');
                const num = document.createElement('span');
                num.className = 'cal-num'; num.textContent = d;
                cell.appendChild(num);
                if (eventos[key]?.length) {
                    const dot = document.createElement('span');
                    dot.className = 'cal-dot'; cell.appendChild(dot);
                }
                cell.addEventListener('click', function() {
                    diaActivo = this.dataset.key;
                    renderCal(); renderDia();
                    document.getElementById('form-evento').style.display = 'flex';
                });
                grid.appendChild(cell);
            }
        }

        function renderDia() {
            const tit  = document.getElementById('tareas-dia-titulo');
            const list = document.getElementById('lista-dia-eventos');
            if (!diaActivo) { tit.textContent = 'Selecciona un dia'; list.innerHTML = ''; return; }
            const [y,m,d] = diaActivo.split('-');
            tit.textContent = `${parseInt(d)} de ${MESES[parseInt(m)-1]} ${y}`;
            const evs = (eventos[diaActivo]||[]).slice().sort((a,b) => a.hora.localeCompare(b.hora));
            if (!evs.length) { list.innerHTML = '<div class="ev-vacio">Sin eventos este dia</div>'; return; }
            list.innerHTML = evs.map(ev => `
                <div class="ev-item">
                    <div class="ev-hora">${window.escapeHTML(ev.hora)}</div>
                    <div class="ev-body">
                        <div class="ev-top">
                            <span class="ev-tipo">${EMOJIS[ev.tipo]||''} ${window.escapeHTML(ev.tipo)}</span>
                            <strong class="ev-mat">${window.escapeHTML(ev.materia)}</strong>
                        </div>
                        <div class="ev-desc">${window.escapeHTML(ev.desc)}</div>
                    </div>
                    <button class="ev-del" data-key="${diaActivo}" data-id="${ev.id}"
                            onclick="window.__evDel(this.dataset.key,this.dataset.id)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>`).join('');
        }

        function renderProximas() {
            const cont = document.getElementById('lista-proximas');
            const hoy = new Date(); hoy.setHours(0,0,0,0);
            const fut = [];
            Object.keys(eventos).forEach(k => {
                const d = new Date(k+'T00:00:00');
                if (d >= hoy) eventos[k].forEach(ev => fut.push({k,ev,d}));
            });
            fut.sort((a,b) => a.d-b.d);
            if (!fut.length) { cont.innerHTML = '<div class="ev-vacio">Sin proximas fechas</div>'; return; }
            cont.innerHTML = fut.slice(0,6).map(({ev,d}) => {
                const diff = Math.ceil((d-hoy)/86400000);
                const dstr = diff===0?'Hoy':diff===1?'Mañana':diff+'d';
                return `<div class="prox-item">
                    <span class="prox-badge${diff<=1?' urg':''}">${dstr}</span>
                    <span class="prox-info">${EMOJIS[ev.tipo]||''} <b>${window.escapeHTML(ev.materia)}</b> — ${window.escapeHTML(ev.desc)}</span>
                </div>`;
            }).join('');
        }

        document.getElementById('btn-guardar-evento').addEventListener('click', () => {
            if (!diaActivo) { G.mostrarToast('Selecciona un dia primero'); return; }
            const hora = document.getElementById('ev-hora').value || '08:00';
            const tipo = document.getElementById('ev-tipo').value;
            const selMat = document.getElementById('ev-materia');
            const mat  = (selMat.value || '').trim();
            const desc = document.getElementById('ev-desc').value.trim();
            if (!mat||!desc) { G.mostrarToast('Completa materia y descripcion'); return; }
            if (!eventos[diaActivo]) eventos[diaActivo] = [];
            eventos[diaActivo].push({id:Date.now().toString(), hora, tipo, materia:mat, desc});
            guardar();
            // Resetear select al placeholder
            const selMatReset = document.getElementById('ev-materia');
            selMatReset.selectedIndex = 0;
            document.getElementById('ev-desc').value    = '';
            // Notif 1 dia antes
            if (Notification.permission==='granted') {
                const hoy  = new Date(); hoy.setHours(0,0,0,0);
                const fecha = new Date(diaActivo+'T00:00:00');
                if (Math.ceil((fecha-hoy)/86400000)===1) {
                    const las23 = new Date(); las23.setHours(23,0,0,0);
                    const delay = las23-Date.now();
                    if (delay>0) setTimeout(() => new Notification('Recordatorio ASEAC',{
                        body:`Mañana: ${mat} - ${desc} a las ${hora}`, icon:'./avalgar.ico'
                    }), delay);
                }
            }
            renderCal(); renderDia(); renderProximas();
            G.mostrarToast('Evento guardado');
        });

        window.__evDel = (key,id) => {
            if (!eventos[key]) return;
            eventos[key] = eventos[key].filter(e => e.id!==id);
            if (!eventos[key].length) delete eventos[key];
            guardar(); renderCal(); renderDia(); renderProximas();
        };

        document.getElementById('cal-prev').addEventListener('click', () => {
            navM--; if(navM<0){navM=11;navY--;} renderCal();
        });
        document.getElementById('cal-next').addEventListener('click', () => {
            navM++; if(navM>11){navM=0;navY++;} renderCal();
        });

        btnAbrir.addEventListener('click', () => { cargar(); poblarSelectMateria(); renderCal(); renderDia(); renderProximas(); modal.style.display='flex'; });
        btnCerrar.addEventListener('click', () => modal.style.display='none');
        modal.addEventListener('click', e => { if(e.target===modal) modal.style.display='none'; });
    })();

    // ─────────────────────────────────────────────────────────────
}
