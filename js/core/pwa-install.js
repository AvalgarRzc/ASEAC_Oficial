(function () {
    let deferredPrompt = null;
    let installBtn = null;
    let bannerMobile = null;

    function isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    }

    function isIOS() {
        const ua = window.navigator.userAgent;
        return /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    window.swRegistration = reg;

                    reg.update().catch(() => {});
                })
                .catch(err => {
                    console.warn('[PWA] Error al registrar Service Worker:', err);
                });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (isInstalled()) {
            return; 
        }

        crearBotonInstalacionEnMenu();
        if (isIOS()) {
            crearBannerInstalacionIOS();
        }
    });

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        mostrarBotonInstalar();
        crearBannerInstalacionAndroid();
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        ocultarElementosInstalacion();
        if (window.G && typeof window.G.mostrarToast === 'function') {
            window.G.mostrarToast('¡ASEAC se ha instalado en tu dispositivo!', 4000);
        }
    });

    function crearBotonInstalacionEnMenu() {
        if (document.getElementById('btn-instalar-app')) return;

        const container = document.getElementById('nav-utilidades') || document.querySelector('.menu-utilidades-wrapper');
        if (!container) return;

        installBtn = document.createElement('button');
        installBtn.id = 'btn-instalar-app';
        installBtn.type = 'button';
        installBtn.className = 'nav-util-btn nav-btn nav-btn--ghost';
        installBtn.setAttribute('data-tip', 'Instalar Aplicación');
        installBtn.setAttribute('aria-label', 'Instalar Aplicación en este dispositivo');
        installBtn.innerHTML = '<i class="fas fa-download" aria-hidden="true"></i>';

        installBtn.addEventListener('click', manejarClicInstalar);
        container.appendChild(installBtn);
    }

    function mostrarBotonInstalar() {
        if (installBtn) {
            installBtn.classList.remove('oculto');
        }
    }

    function ocultarElementosInstalacion() {
        if (installBtn) installBtn.classList.add('oculto');
        if (bannerMobile && bannerMobile.parentNode) {
            bannerMobile.parentNode.removeChild(bannerMobile);
        }
    }

    async function manejarClicInstalar() {
        if (deferredPrompt) {

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                ocultarElementosInstalacion();
            }
            deferredPrompt = null;
        } else if (isIOS()) {

            mostrarModalGuiaIOS();
        } else {

            mostrarModalGuiaGeneral();
        }
    }

    function crearBannerInstalacionAndroid() {
        if (document.getElementById('pwa-install-banner') || isInstalled()) return;
        if (window.innerWidth > 768) return; 
        if (sessionStorage.getItem('pwa_banner_dismissed') === '1') return;

        bannerMobile = document.createElement('div');
        bannerMobile.id = 'pwa-install-banner';
        bannerMobile.className = 'pwa-banner';
        bannerMobile.innerHTML = `
            <div class="pwa-banner-content">
                <img src="icon-192.png" alt="ASEAC Logo" class="pwa-banner-icon">
                <div class="pwa-banner-text">
                    <span class="pwa-banner-title">Instalar ASEAC</span>
                    <span class="pwa-banner-sub">Acceso rápido sin conexión</span>
                </div>
            </div>
            <div class="pwa-banner-actions">
                <button type="button" class="pwa-btn-install" id="pwa-btn-banner-action">Instalar</button>
                <button type="button" class="pwa-btn-close" id="pwa-btn-banner-close" aria-label="Cerrar">&times;</button>
            </div>
        `;

        document.body.appendChild(bannerMobile);

        document.getElementById('pwa-btn-banner-action')?.addEventListener('click', () => {
            manejarClicInstalar();
        });

        document.getElementById('pwa-btn-banner-close')?.addEventListener('click', () => {
            bannerMobile.remove();
            sessionStorage.setItem('pwa_banner_dismissed', '1');
        });
    }

    function crearBannerInstalacionIOS() {
        if (document.getElementById('pwa-install-banner') || isInstalled()) return;
        if (window.innerWidth > 768) return;
        if (sessionStorage.getItem('pwa_banner_dismissed') === '1') return;

        bannerMobile = document.createElement('div');
        bannerMobile.id = 'pwa-install-banner';
        bannerMobile.className = 'pwa-banner';
        bannerMobile.innerHTML = `
            <div class="pwa-banner-content">
                <img src="apple-touch-icon.png" alt="ASEAC Logo" class="pwa-banner-icon">
                <div class="pwa-banner-text">
                    <span class="pwa-banner-title">Instalar ASEAC</span>
                    <span class="pwa-banner-sub">Agrégala a tu pantalla de inicio</span>
                </div>
            </div>
            <div class="pwa-banner-actions">
                <button type="button" class="pwa-btn-install" id="pwa-btn-banner-action">¿Cómo?</button>
                <button type="button" class="pwa-btn-close" id="pwa-btn-banner-close" aria-label="Cerrar">&times;</button>
            </div>
        `;

        document.body.appendChild(bannerMobile);

        document.getElementById('pwa-btn-banner-action')?.addEventListener('click', () => {
            mostrarModalGuiaIOS();
        });

        document.getElementById('pwa-btn-banner-close')?.addEventListener('click', () => {
            bannerMobile.remove();
            sessionStorage.setItem('pwa_banner_dismissed', '1');
        });
    }

    function mostrarModalGuiaIOS() {
        removerModalExistente();

        const modal = document.createElement('div');
        modal.id = 'pwa-modal-guia';
        modal.className = 'pwa-modal-overlay';
        modal.innerHTML = `
            <div class="pwa-modal-card">
                <div class="pwa-modal-header">
                    <img src="apple-touch-icon.png" alt="ASEAC" class="pwa-modal-icon">
                    <div class="pwa-modal-title">Instalar ASEAC en iPhone / iPad</div>
                    <button type="button" class="pwa-modal-close" id="pwa-modal-close-btn">&times;</button>
                </div>
                <div class="pwa-modal-body">
                    <div class="pwa-step">
                        <span class="pwa-step-num">1</span>
                        <div class="pwa-step-desc">
                            En Safari, toca el botón <strong>Compartir</strong> <i class="fas fa-arrow-up-from-bracket pwa-highlight-icon"></i> en la barra de navegación.
                        </div>
                    </div>
                    <div class="pwa-step">
                        <span class="pwa-step-num">2</span>
                        <div class="pwa-step-desc">
                            Desliza hacia abajo en el menú y selecciona <strong>"Agregar a la pantalla de inicio"</strong> <i class="far fa-plus-square pwa-highlight-icon"></i>.
                        </div>
                    </div>
                    <div class="pwa-step">
                        <span class="pwa-step-num">3</span>
                        <div class="pwa-step-desc">
                            Toca <strong>"Agregar"</strong> en la esquina superior derecha para finalizar.
                        </div>
                    </div>
                </div>
                <div class="pwa-modal-footer">
                    <button type="button" class="pwa-modal-btn-entendido" id="pwa-modal-ok-btn">Entendido</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('pwa-modal-close-btn')?.addEventListener('click', removerModalExistente);
        document.getElementById('pwa-modal-ok-btn')?.addEventListener('click', removerModalExistente);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) removerModalExistente();
        });
    }

    function mostrarModalGuiaGeneral() {
        removerModalExistente();

        const modal = document.createElement('div');
        modal.id = 'pwa-modal-guia';
        modal.className = 'pwa-modal-overlay';
        modal.innerHTML = `
            <div class="pwa-modal-card">
                <div class="pwa-modal-header">
                    <img src="icon-192.png" alt="ASEAC" class="pwa-modal-icon">
                    <div class="pwa-modal-title">Instalar ASEAC</div>
                    <button type="button" class="pwa-modal-close" id="pwa-modal-close-btn">&times;</button>
                </div>
                <div class="pwa-modal-body">
                    <p style="margin: 0 0 12px; color: #a0aec0; font-size: 13.5px; line-height: 1.5;">
                        Puedes instalar ASEAC como aplicación nativa desde tu navegador para tener acceso directo y trabajar sin conexión:
                    </p>
                    <div class="pwa-step">
                        <span class="pwa-step-num"><i class="fas fa-ellipsis-v"></i></span>
                        <div class="pwa-step-desc">
                            Abre el menú de opciones de tu navegador (los <strong>tres puntos</strong> o configuración).
                        </div>
                    </div>
                    <div class="pwa-step">
                        <span class="pwa-step-num"><i class="fas fa-download"></i></span>
                        <div class="pwa-step-desc">
                            Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                        </div>
                    </div>
                </div>
                <div class="pwa-modal-footer">
                    <button type="button" class="pwa-modal-btn-entendido" id="pwa-modal-ok-btn">Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('pwa-modal-close-btn')?.addEventListener('click', removerModalExistente);
        document.getElementById('pwa-modal-ok-btn')?.addEventListener('click', removerModalExistente);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) removerModalExistente();
        });
    }

    function removerModalExistente() {
        const m = document.getElementById('pwa-modal-guia');
        if (m) m.remove();
    }
})();
