/**
 * VAGABON — js/loader.js
 * Loader d'introduction simple et accessible (section 25 du brief).
 * - Durée maximale forcée (ne bloque jamais indéfiniment le site).
 * - Masqué dès que le contenu essentiel (DOM) est prêt.
 * - Respecte prefers-reduced-motion (pas d'animation de barre).
 */

(function () {
  "use strict";

  const MAX_DURATION_MS = 1400;
  const MIN_DURATION_MS = 400;

  function hideLoader(loader) {
    if (!loader) return;
    loader.classList.add("is-hidden");
    loader.setAttribute("aria-hidden", "true");
    window.setTimeout(function () {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 650);
  }

  function initLoader() {
    const loader = document.querySelector("[data-loader]");
    if (!loader) return;

    const start = Date.now();

    function attemptHide() {
      const elapsed = Date.now() - start;
      const remaining = Math.max(MIN_DURATION_MS - elapsed, 0);
      window.setTimeout(function () { hideLoader(loader); }, remaining);
    }

    if (document.readyState === "complete") {
      attemptHide();
    } else {
      window.addEventListener("load", attemptHide);
    }

    // Filet de sécurité : le loader ne doit jamais rester affiché.
    window.setTimeout(function () { hideLoader(loader); }, MAX_DURATION_MS);
  }

  initLoader();
})();
