// estudio.js — se llama desde app.js pasando el namespace G
function initEstudio(G) {
    // ─────────────────────────────────────────────────────────────
    // MÓDULO 3: MODO ESTUDIO — TEMPORIZADOR POMODORO
    // ─────────────────────────────────────────────────────────
    // IIFE que encapsula el timer y las notas rápidas.
    //
    // TIMER SVG:
    //   · El anillo de progreso es un <circle> SVG con stroke-dashoffset.
    //   · CIRC = 2πr (r=96) = circunferencia completa del anillo.
    //   · actualizarAnillo() calcula el offset según (restanSeg / totalSeg).
    //   · actualizarDisplay() formatea MM:SS y llama a actualizarAnillo().
    //
    // MODOS: 4 botones .tmodo con data-min y data-label.
    //   Al hacer clic (si el timer no está corriendo) cambia totalSeg y resetea.
    //
    // PLAY/PAUSE: setInterval de 1 segundo decrementa restanSeg.
    //   Al llegar a 0: para el timer, incrementa sesiones si el modo era ≥25min,
    //   persiste en "aseac-ses", envía notificación y muestra toast.
    //
    // RESET: limpia el intervalo y reinicia restanSeg al totalSeg del modo activo.
    //
    // NOTAS RÁPIDAS: textarea #estudio-notas persistido en "aseac-notas".
    //
    // PENDIENTES: renderPend() lee "aseac-eventos" y muestra los próximos 6
    //   eventos con badge de días restantes (urgente si ≤1 día).
    // =========================================================
    (function() {
        const modal    = document.getElementById('modal-estudio');
        const btnAbrir = document.getElementById('btn-abrir-estudio');
        const btnCerrar= document.getElementById('btn-cerrar-estudio');
        const btnPlay  = document.getElementById('btn-timer-play');
        const btnReset = document.getElementById('btn-timer-reset');
        const elTiempo = document.getElementById('timer-tiempo');
        const elLabel  = document.getElementById('timer-label-txt');
        const elSes    = document.getElementById('ses-num');
        const ringEl   = document.getElementById('tring-fg');
        const CIRC     = 2 * Math.PI * 96;

        let totalSeg=25*60, restanSeg=25*60, activo=false, intervalo=null;
        let sesiones=parseInt(localStorage.getItem('aseac-ses')||'0');

        function actualizarAnillo() {
            if (!ringEl) return;
            ringEl.setAttribute('stroke-dasharray',  CIRC.toFixed(2));
            ringEl.setAttribute('stroke-dashoffset', (CIRC*(1-restanSeg/totalSeg)).toFixed(2));
        }
        function actualizarDisplay() {
            const m=String(Math.floor(restanSeg/60)).padStart(2,'0');
            const s=String(restanSeg%60).padStart(2,'0');
            if(elTiempo) elTiempo.textContent=m+':'+s;
            actualizarAnillo();
        }

        document.querySelectorAll('.tmodo').forEach(btn => {
            btn.addEventListener('click', function() {
                if(activo) return;
                document.querySelectorAll('.tmodo').forEach(b=>b.classList.remove('activo'));
                this.classList.add('activo');
                totalSeg=parseInt(this.dataset.min)*60; restanSeg=totalSeg;
                if(elLabel) elLabel.textContent=this.dataset.label;
                actualizarDisplay();
            });
        });

        btnPlay.addEventListener('click', function() {
            if(activo) {
                clearInterval(intervalo); activo=false;
                btnPlay.innerHTML='<i class="fas fa-play"></i>';
            } else {
                if(restanSeg<=0) return;
                activo=true;
                btnPlay.innerHTML='<i class="fas fa-pause"></i>';
                intervalo=setInterval(() => {
                    restanSeg--;
                    actualizarDisplay();
                    if(restanSeg<=0) {
                        clearInterval(intervalo); activo=false;
                        btnPlay.innerHTML='<i class="fas fa-play"></i>';
                        const modo=document.querySelector('.tmodo.activo');
                        if(modo && parseInt(modo.dataset.min)>=25) {
                            sesiones++; localStorage.setItem('aseac-ses',String(sesiones));
                            if(elSes) elSes.textContent=sesiones;
                        }
                        if(Notification.permission==='granted')
                            new Notification('ASEAC - Sesion completada',{
                                body:(modo?.dataset.label||'Sesion')+' terminada.',
                                icon:'./avalgar.ico'
                            });
                        G.mostrarToast('Sesion completada. Toma un descanso.');
                    }
                }, 1000);
            }
        });

        btnReset.addEventListener('click', () => {
            clearInterval(intervalo); activo=false;
            btnPlay.innerHTML='<i class="fas fa-play"></i>';
            const modo=document.querySelector('.tmodo.activo');
            totalSeg=parseInt(modo?.dataset.min||25)*60; restanSeg=totalSeg;
            actualizarDisplay();
        });

        const notasEl=document.getElementById('estudio-notas');
        if(notasEl) {
            notasEl.value=localStorage.getItem('aseac-notas')||'';
            notasEl.addEventListener('input',()=>localStorage.setItem('aseac-notas',notasEl.value));
        }

        function renderPend() {
            const cont=document.getElementById('estudio-pendientes');
            if(!cont) return;
            let evs={}; try{evs=JSON.parse(localStorage.getItem('aseac-eventos')||'{}');}catch(e){}
            const hoy=new Date(); hoy.setHours(0,0,0,0);
            const lista=[];
            Object.keys(evs).forEach(k=>{
                const d=new Date(k+'T00:00:00');
                if(d>=hoy) evs[k].forEach(ev=>lista.push({ev,d}));
            });
            lista.sort((a,b)=>a.d-b.d);
            const EM={tarea:'📝',parcial:'📋',proyecto:'💼',examen:'🎯'};
            //sirve bastantes los emojs
            cont.innerHTML=lista.length
                ? lista.slice(0,6).map(({ev,d})=>{
                    const diff=Math.ceil((d-hoy)/86400000);
                    const dstr=diff===0?'Hoy':diff===1?'Mañana':diff+'d';
                    return `<div class="estudio-pend-item"><span>${EM[ev.tipo]||'📌'} <b>${ev.materia}</b> — ${ev.desc}</span><span class="pend-dias${diff<=1?' urg':''}">${dstr}</span></div>`;
                }).join('')
                : '<p style="opacity:.4;font-size:.8em;padding:6px 0">Sin pendientes</p>';
        }

        btnAbrir.addEventListener('click', ()=>{ actualizarDisplay(); if(elSes) elSes.textContent=sesiones; renderPend(); modal.style.display='flex'; });
        btnCerrar.addEventListener('click', ()=>{ clearInterval(intervalo); activo=false; btnPlay.innerHTML='<i class="fas fa-play"></i>'; modal.style.display='none'; });
        modal.addEventListener('click', e=>{ if(e.target===modal) modal.style.display='none'; });

        actualizarDisplay(); // init ring
    })();
}
