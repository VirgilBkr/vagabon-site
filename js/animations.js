/**
 * VAGABON — js/animations.js
 * Animations de phase 1 uniquement : apparitions simples via
 * IntersectionObserver sur les éléments [data-reveal]. Respecte
 * prefers-reduced-motion (aucune observation n'est faite, tout reste
 * visible immédiatement). Les attributs data-parallax, data-animation-group
 * sont posés dans le HTML pour la phase 2 (GSAP/ScrollTrigger/Lenis) mais
 * ne sont pas exploités ici : leur absence ou présence ne change rien au
 * fonctionnement actuel du site.
 *
 * Ce fichier gère aussi, uniquement sur les pages qui en ont besoin (no-op
 * sinon) :
 * - le bouton de défilement du Hero d'accueil ([data-scroll-target]) ;
 * - un très léger effet de sortie du Hero au scroll (#home-hero).
 *
 * L'ancienne vidéo d'arrière-plan du Hero ([data-hero-video]) a été
 * remplacée par un univers 3D Marble (iframe, voir index.html /
 * css/pages/home.css) : les fonctions initHeroVideo() et
 * initHeroVideoAudio() qui géraient son fondu d'apparition, sa pause sous
 * prefers-reduced-motion et le bouton son du header ont été retirées, ce
 * code n'ayant plus aucun élément à cibler.
 */

(function () {
  "use strict";

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function initReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (items.length === 0) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    try {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

      items.forEach(function (el) { observer.observe(el); });
    } catch (err) {
      // Filet de sécurité : si IntersectionObserver échoue pour une raison
      // quelconque (API restreinte, contexte inhabituel type file://...),
      // le contenu ne doit jamais rester invisible.
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    // Filet de sécurité supplémentaire, indépendant de l'observateur : si,
    // pour une raison quelconque, un élément n'a toujours pas été révélé
    // après un court délai (observateur qui ne se déclenche jamais dans un
    // contexte particulier, y compris l'ouverture directe du fichier via
    // file://), on le révèle quand même. Le contenu du site ne doit jamais
    // rester bloqué à opacity: 0 indéfiniment.
    window.setTimeout(function () {
      document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }, 1800);
  }

  /**
   * Bouton "Entrer dans l'univers" du Hero d'accueil. Défilement natif
   * (scrollIntoView), instantané si prefers-reduced-motion est actif,
   * fonctionne sans Lenis ni GSAP. Ne fait rien sur les pages qui ne
   * possèdent pas de bouton [data-scroll-target].
   */
  function initHeroScrollButton() {
    const button = document.querySelector("[data-scroll-target]");
    if (!button) return;

    button.addEventListener("click", function () {
      const targetSelector = button.getAttribute("data-scroll-target");
      const target = targetSelector ? document.querySelector(targetSelector) : null;
      if (!target) return;

      const reducedMotion = prefersReducedMotion();

      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });

      // Place le focus sur la section suivante une fois le défilement
      // terminé, sans à-coup ni saut visuel supplémentaire pour
      // l'utilisateur clavier / lecteur d'écran.
      const hadTabIndex = target.hasAttribute("tabindex");
      if (!hadTabIndex) target.setAttribute("tabindex", "-1");

      window.setTimeout(function () {
        target.focus({ preventScroll: true });
        if (!hadTabIndex) target.removeAttribute("tabindex");
      }, reducedMotion ? 0 : 550);
    });
  }

  /**
   * Effet de sortie très subtil du Hero d'accueil : une fois le défilement
   * commencé, le cadre et le bouton perdent en opacité (voir .is-leaving
   * dans css/pages/home.css). Purement décoratif, écouteur passif et
   * limité par requestAnimationFrame pour rester performant. Désactivé
   * sous prefers-reduced-motion (aucun mouvement superflu).
   */
  function initHeroLeaveEffect() {
    const hero = document.getElementById("home-hero");
    if (!hero || prefersReducedMotion()) return;

    let ticking = false;

    function update() {
      hero.classList.toggle("is-leaving", window.scrollY > window.innerHeight * 0.08);
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  function init() {
    initReveal();
    initHeroScrollButton();
    initHeroLeaveEffect();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
