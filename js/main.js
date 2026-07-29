/**
 * VAGABON — js/main.js
 * Point d'entrée léger. Les modules (navigation, theme, language, cursor,
 * loader, audio, scroll-top, filters, forms, newsletter, calendly,
 * animations, data-renderer, accessibility) s'auto-initialisent chacun
 * de leur côté (voir leurs propres IIFE) et sont chargés avec l'attribut
 * defer directement depuis le HTML. Ce fichier ne fait que journaliser
 * un éventuel souci de chargement et exposer un espace de nom global
 * minimal pour éviter toute variable non maîtrisée.
 */

window.Vagabon = window.Vagabon || {};

(function () {
  "use strict";

  window.addEventListener("error", function (event) {
    // Filet de sécurité : n'importe quelle erreur JS non interceptée est
    // journalisée sans jamais casser visuellement la page (site statique,
    // dégradation progressive).
    if (window.console && console.warn) {
      console.warn("[Vagabon] Erreur JavaScript interceptée :", event.message);
    }
  });
})();
