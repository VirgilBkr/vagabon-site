/**
 * VAGABON — js/data-renderer.js
 * Nettoyage du site : les fonctions de rendu de l'ancien portfolio
 * (services, projets, témoignages, articles) ont été retirées avec les
 * pages et fichiers data/*.js correspondants. Seule reste
 * renderSocialLinks(), utilisée par le menu de la landing page.
 */

(function () {
  "use strict";

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderSocialLinks() {
    const containers = document.querySelectorAll("[data-social-links]");
    if (containers.length === 0 || typeof VAGABON_SETTINGS === "undefined") return;

    const icons = {
      linkedin: "in",
      instagram: "ig",
      behance: "be",
    };

    containers.forEach(function (container) {
      container.innerHTML = "";
      Object.keys(VAGABON_SETTINGS.socialLinks).forEach(function (key) {
        const url = VAGABON_SETTINGS.socialLinks[key];
        const link = document.createElement("a");
        link.className = "c-icon-btn";
        link.setAttribute("aria-label", key.charAt(0).toUpperCase() + key.slice(1));
        link.textContent = icons[key] || key.slice(0, 2);

        if (url) {
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        } else {
          // Pas de lien cassé : élément visible mais désactivé, avec une
          // indication claire pour l'équipe éditoriale (attribut data).
          link.setAttribute("aria-disabled", "true");
          link.setAttribute("tabindex", "-1");
          link.classList.add("is-disabled");
          link.style.opacity = "0.35";
          link.setAttribute("data-missing-link", "Renseigner l'URL " + key + " dans data/settings.js");
        }
        container.appendChild(link);
      });
    });
  }

  function init() {
    renderSocialLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
