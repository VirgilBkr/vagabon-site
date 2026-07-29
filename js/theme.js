/**
 * VAGABON — js/theme.js
 * Bascule thème sombre / clair. Sombre par défaut (section 22 du brief).
 * - Enregistre le choix dans localStorage ("vagabon-theme").
 * - Respecte le réglage système uniquement lors de la toute première
 *   visite (aucune préférence enregistrée).
 * - Met à jour aria-label et aria-pressed sur le bouton.
 * - Le thème est déjà appliqué en amont par le script inline "anti-flash"
 *   présent dans le <head> de chaque page (voir commentaire dans le head) :
 *   ce module se contente ensuite de brancher l'interaction.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "vagabon-theme";

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      /* localStorage indisponible (navigation privée...) : on continue
         sans persister, le site reste fonctionnel. */
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function updateToggleButton(button, theme) {
    if (!button) return;
    const isLight = theme === "light";
    button.setAttribute("aria-pressed", String(isLight));
    const label = isLight ? "Passer en thème sombre" : "Passer en thème clair";
    button.setAttribute("aria-label", label);
    button.setAttribute("data-i18n-attr", "aria-label:" + (isLight ? "nav.theme.dark" : "nav.theme.light"));
  }

  function initTheme() {
    // "light" est désormais le thème par défaut du site (refonte graphique
    // post-Hero, voir variables.css) — anciennement "dark". En pratique,
    // l'attribut data-theme est déjà posé par le script anti-flash inline
    // du <head> avant l'exécution de ce fichier ; ce dernier "|| ..." n'est
    // qu'un filet de sécurité si jamais cet attribut manquait.
    const current = document.documentElement.getAttribute("data-theme") || getStoredTheme() || "light";
    applyTheme(current);

    const toggleButtons = document.querySelectorAll("[data-theme-toggle]");
    toggleButtons.forEach(function (button) {
      updateToggleButton(button, current);
      button.addEventListener("click", function () {
        const active = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
        applyTheme(active);
        storeTheme(active);
        toggleButtons.forEach(function (b) { updateToggleButton(b, active); });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
  } else {
    initTheme();
  }
})();
