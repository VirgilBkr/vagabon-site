/**
 * VAGABON — js/accessibility.js
 * Petits utilitaires transverses d'accessibilité :
 * - ajoute la classe "js" sur <html> (permet aux animations CSS de ne
 *   s'activer que si JS est disponible — dégradation propre sinon) ;
 * - annonce les changements de statut de formulaire aux lecteurs d'écran
 *   via une zone live partagée ;
 * - détecte prefers-reduced-motion et expose la classe "reduced-motion".
 */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reduced-motion");
  }

  /**
   * Crée (si besoin) une région aria-live globale et permet d'y annoncer
   * un message. Utilitaire d'accessibilité générique (non lié à une page
   * précise) : sans appelant depuis le nettoyage du site, conservé comme
   * infrastructure prête pour les futurs formulaires/messages.
   */
  window.vagabonAnnounce = function (message) {
    let liveRegion = document.getElementById("vagabon-live-region");
    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.id = "vagabon-live-region";
      liveRegion.setAttribute("role", "status");
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.className = "u-visually-hidden";
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = "";
    window.setTimeout(function () {
      liveRegion.textContent = message;
    }, 50);
  };
})();
