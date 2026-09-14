function initMobile(G) {

    initMobileMalla(G);

    _cargarCSS('css/mobile/mobile-navbar.css');
    _cargarCSS('css/mobile/mobile-malla.css');

    initMobileNavbar();

    function _cargarCSS(href) {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.rel  = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }
    }
}
