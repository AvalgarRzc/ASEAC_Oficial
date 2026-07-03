// ********************************************************************
// *  utils.js — Utilidades Varias (Core)                             *
// *                                                                  *
// *  Propósito: Proveer funciones de ayuda generales como generación *
// *  de colores para las materias.                                   *
// ********************************************************************

function initUtils(G) {
    // G.obtenerColorPorSigla(sigla)
    // Genera un color neon determinista a partir de la sigla de la materia.
    G.obtenerColorPorSigla = function(sigla) {
        let hash = 0;
        for (let i = 0; i < sigla.length; i++) {
            hash = sigla.charCodeAt(i) + ((hash << 5) - hash);
        }
        return G.coloresNeon[Math.abs(hash) % G.coloresNeon.length];
    };
}
