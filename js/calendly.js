/**
 * VAGABON — js/calendly.js
 * Intégration légère de Calendly (voir README.md, section 10) : les boutons
 * [data-calendly-button] ouvrent VAGABON_SETTINGS.calendlyUrl dans un
 * nouvel onglet. Aucun embed/iframe chargé — volontairement, pour ne pas
 * alourdir la page tant que ce n'est pas nécessaire.
 *
 * Tant que calendlyUrl reste sur sa valeur placeholder (ou est vide), le
 * bouton est neutralisé (aria-disabled) et affiche un message clair
 * invitant à utiliser le formulaire à la place — jamais de lien cassé ni
 * d'erreur silencieuse.
 *
 * Pour connecter votre lien réel : data/settings.js → VAGABON_SETTINGS.calendlyUrl.
 */

(function () {
  "use strict";

  var PLACEHOLDER_URL = "https://calendly.com/votre-identifiant/appel-decouverte";

  function isPlaceholder(url) {
    return !url || url.trim() === "" || url.trim() === PLACEHOLDER_URL;
  }

  function initCalendlyButtons() {
    var buttons = document.querySelectorAll("[data-calendly-button]");
    if (buttons.length === 0) return;

    var settings = window.VAGABON_SETTINGS || {};
    var url = settings.calendlyUrl;

    buttons.forEach(function (button) {
      var note = null;
      var noteSelector = button.getAttribute("data-calendly-note-target");
      if (noteSelector) note = document.querySelector(noteSelector);

      if (isPlaceholder(url)) {
        button.setAttribute("aria-disabled", "true");
        button.removeAttribute("href");
        button.addEventListener("click", function (event) {
          event.preventDefault();
          if (note) note.classList.add("is-visible");
        });
        return;
      }

      button.setAttribute("href", url);
      button.setAttribute("target", "_blank");
      button.setAttribute("rel", "noopener noreferrer");
    });
  }

  /**
   * Emplacement réservé pour une future modale Calendly intégrée (iframe),
   * si vous préférez éviter l'ouverture d'un nouvel onglet. Non activé par
   * défaut (voir la demande explicite de privilégier une intégration
   * légère) — proposez-moi l'activation avant de la coder si vous la
   * souhaitez, car un embed Calendly charge un script tiers supplémentaire.
   */
  function initCalendlyEmbed() {
    // Volontairement non implémenté — voir commentaire ci-dessus.
  }

  function init() {
    initCalendlyButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
