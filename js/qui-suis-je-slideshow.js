/**
 * VAGABON — js/qui-suis-je-slideshow.js
 * Diaporama automatique (2 photos, fondu enchaîné + léger zoom) pour le
 * visuel de droite de la section "Mon profil" (01) sur qui-suis-je.html
 * UNIQUEMENT. Fichier indépendant, chargé sur cette seule page — aucune
 * autre section, aucun autre script n'est concerné.
 *
 * Principe : tout l'effet visuel (fondu, zoom, durées, prefers-reduced-
 * motion) est porté par CSS (voir .who-section__slideshow /
 * .who-section__slide dans css/pages/qui-suis-je.css) — ce script se
 * contente de basculer la classe "is-active" entre les deux <img> à
 * intervalle régulier. Pas de bibliothèque externe, pas de carousel/
 * contrôles : un minuteur simple, silencieux, sans bouton ni flèche.
 *
 * Durées (voir aussi les commentaires CSS) :
 *   - DISPLAY_MS = 3000ms  : temps d'affichage d'une image avant de céder
 *     la place à l'autre (demande explicite : "environ 3 secondes").
 *   - Le fondu + zoom qui accompagne le changement dure 1200ms côté CSS
 *     (transition sur .who-section__slide) — volontairement plus court que
 *     DISPLAY_MS pour ne jamais chevaucher le cycle suivant.
 *
 * Performance : un seul setInterval, suspendu via IntersectionObserver
 * quand le composant n'est pas à l'écran (même technique déjà utilisée par
 * js/universe-hero-distortion.js sur une autre page) — aucun calcul de
 * layout, aucune dépendance.
 */
(function () {
  "use strict";

  if (!document.body.classList.contains("page-qui-suis-je")) return;

  var DISPLAY_MS = 3000;

  function init() {
    var slideshow = document.querySelector("[data-auto-slideshow]");
    if (!slideshow) return;

    var slides = slideshow.querySelectorAll(".who-section__slide");
    if (slides.length < 2) return; // rien à faire tourner avec 0 ou 1 image

    var activeIndex = 0;
    Array.prototype.forEach.call(slides, function (slide, i) {
      slide.classList.toggle("is-active", i === activeIndex);
    });

    var timer = null;

    function advance() {
      var nextIndex = (activeIndex + 1) % slides.length;
      slides[activeIndex].classList.remove("is-active");
      slides[nextIndex].classList.add("is-active");
      activeIndex = nextIndex;
    }

    function start() {
      if (timer) return; // déjà en cours, évite les doublons d'intervalle
      timer = window.setInterval(advance, DISPLAY_MS);
    }

    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    // Ne tourne que lorsque le composant est réellement visible à l'écran
    // (économie de cycles CPU/GPU quand l'utilisateur est ailleurs sur la
    // page) — comportement additif, jamais requis pour que l'effet
    // fonctionne, juste une optimisation.
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) start();
          else stop();
        },
        { threshold: 0 }
      );
      io.observe(slideshow);
    } else {
      start();
    }

    // Suspend également l'alternance quand l'onglet est masqué (économie
    // supplémentaire, même logique que ci-dessus).
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (slideshow.getBoundingClientRect().top < window.innerHeight) start();
    });
  }

  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  } catch (e) {
    // Aucune conséquence visible en cas d'erreur : la première image reste
    // affichée seule (classe "is-active" déjà posée dans le HTML), sans
    // alternance — jamais de contenu manquant.
  }
})();
