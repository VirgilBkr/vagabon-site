/**
 * VAGABON — js/universe-services.js
 * ============================================================================
 * Enrichissements de la section Services de universe.html (.universe-services,
 * insérée entre Projets et Témoignages) — v2, sommaire éditorial à bandeaux
 * empilés. Ce fichier n'est chargé que sur cette page et ne cible strictement
 * que les éléments de cette section — aucune interaction avec le reste du DOM
 * ni avec les autres scripts déjà en place (js/animations.js, js/universe.js).
 *
 * DÉGRADATION — sans ce script (ou si GSAP/ScrollTrigger ne chargent pas), les
 * 4 panneaux restent simplement empilés et intégralement dépliés (voir
 * css/pages/universe.css : grid-template-rows:1fr par défaut, jamais 0fr sans
 * la classe .is-services-interactive ajoutée ci-dessous). Rien n'est jamais
 * masqué en attendant un script.
 *
 * PROGRESSIVE ENHANCEMENT — dès que ce script s'exécute, il active un
 * accordéon cliquable/clavier (classe .is-services-interactive), QUE GSAP soit
 * disponible ou non : un seul service reste développé à la fois, les 3 autres
 * se réduisent à un fin bandeau titre. Ce comportement de base ne dépend
 * d'aucune bibliothèque et fonctionne identiquement au clic, au clavier
 * (Entrée/Espace sur les <button> réels) et au tactile.
 *
 * ENRICHISSEMENT DESKTOP — uniquement si GSAP + ScrollTrigger sont chargés,
 * ET uniquement dans le contexte "(min-width:901px) and
 * (prefers-reduced-motion:no-preference) and (pointer:fine)" piloté par
 * gsap.matchMedia() : la section se pin brièvement, le défilement fait défiler
 * séquentiellement les 4 services (1→2→3→4) puis relâche naturellement vers
 * Témoignages, et chaque service qui s'active reçoit une courte rotation
 * d'entrée (axe Z, origine bas-gauche, quelques degrés) qui évoque une page
 * qui se pose. gsap.matchMedia() nettoie automatiquement et uniquement CE
 * ScrollTrigger/ces tweens dès que le contexte ne correspond plus (mobile,
 * reduced-motion, ou pointeur tactile) — jamais ScrollTrigger.killAll(), et
 * aucun effet créé en dehors de .universe-services.
 * ============================================================================
 */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var section = document.querySelector(".universe-services");
    if (!section) return;

    var stack = section.querySelector("[data-services-stack]");
    var panels = Array.prototype.slice.call(section.querySelectorAll("[data-service-panel]"));
    if (!stack || panels.length === 0) return;

    var toggles = panels.map(function (panel) {
      return panel.querySelector("[data-service-toggle]");
    });
    var contents = panels.map(function (panel) {
      return panel.querySelector("[data-service-content]");
    });
    var bodies = panels.map(function (panel) {
      return panel.querySelector(".universe-services__panel-body");
    });

    var currentIndex = panels.findIndex(function (panel) {
      return panel.classList.contains("is-active");
    });
    if (currentIndex < 0) currentIndex = 0;

    var gsap = window.gsap || null;
    var ScrollTrigger = window.ScrollTrigger || null;
    var desktopTrigger = null;

    /* ---------------------------------------------------------------- */
    /* Activation d'un service — logique partagée par le clic, le clavier */
    /* (via le <button> natif) et, en desktop, la synchronisation scroll. */
    /* Ne fait jamais rien de destructif : bascule seulement des classes  */
    /* et attributs ARIA, jamais de contenu retiré du DOM.                */
    /* ---------------------------------------------------------------- */
    function activateIndex(index, opts) {
      if (index === currentIndex || index < 0 || index >= panels.length) return;
      var animateEntrance = opts && opts.animateEntrance;

      var prevPanel = panels[currentIndex];
      var prevToggle = toggles[currentIndex];
      if (prevPanel) prevPanel.classList.remove("is-active");
      if (prevToggle) prevToggle.setAttribute("aria-expanded", "false");

      var nextPanel = panels[index];
      var nextToggle = toggles[index];
      nextPanel.classList.add("is-active");
      if (nextToggle) nextToggle.setAttribute("aria-expanded", "true");

      currentIndex = index;

      if (animateEntrance && gsap) {
        var body = bodies[index];
        if (body) {
          gsap.killTweensOf(body);
          gsap.fromTo(
            body,
            { rotation: 8, y: 18, transformOrigin: "0% 100%" },
            { rotation: 0, y: 0, duration: 0.55, ease: "power2.out" }
          );
        }
      }
    }

    /* ---------------------------------------------------------------- */
    /* Accordéon de base — toujours actif dès que ce script s'exécute,   */
    /* indépendamment de GSAP. C'est ce qui reste sous reduced-motion et  */
    /* sur mobile/tactile : simple bascule de classe, transition CSS      */
    /* d'opacité déjà définie dans universe.css.                          */
    /* ---------------------------------------------------------------- */
    section.classList.add("is-services-interactive");

    toggles.forEach(function (toggle, index) {
      if (!toggle) return;
      toggle.addEventListener("click", function () {
        activateIndex(index, { animateEntrance: !!desktopTrigger });
        if (desktopTrigger) {
          var start = desktopTrigger.start;
          var end = desktopTrigger.end;
          var target = start + ((index + 0.5) / panels.length) * (end - start);
          desktopTrigger.scroll(target);
        }
      });
    });

    /* ---------------------------------------------------------------- */
    /* Enrichissement desktop — pin + défilement séquentiel + rotation    */
    /* d'entrée. Entièrement conditionné par gsap.matchMedia() : jamais    */
    /* créé (et donc jamais à nettoyer) hors de ce contexte précis.       */
    /* ---------------------------------------------------------------- */
    if (gsap && ScrollTrigger) {
      try {
        gsap.registerPlugin(ScrollTrigger);
        var mm = gsap.matchMedia();

        mm.add(
          "(min-width: 901px) and (prefers-reduced-motion: no-preference) and (pointer: fine)",
          function () {
            var trigger = ScrollTrigger.create({
              trigger: stack,
              start: "top top",
              end: function () {
                return "+=" + Math.round(window.innerHeight * 1.6);
              },
              pin: true,
              pinSpacing: true,
              scrub: 0.6,
              onUpdate: function (self) {
                var zone = Math.min(panels.length - 1, Math.floor(self.progress * panels.length));
                activateIndex(zone, { animateEntrance: true });
              }
            });

            desktopTrigger = trigger;

            // Nettoyage ciblé : gsap.matchMedia() appelle automatiquement
            // cette fonction de retour lorsque le contexte cesse de
            // correspondre (résolution, reduced-motion, tactile), et se
            // charge de tuer le ScrollTrigger créé dans ce contexte précis —
            // jamais ScrollTrigger.killAll(), jamais d'effet sur d'autres
            // instances créées ailleurs sur la page.
            return function () {
              desktopTrigger = null;
            };
          }
        );
      } catch (e) {
        // Sécurité : en cas d'échec de GSAP/ScrollTrigger en cours de route,
        // l'accordéon de base (déjà branché ci-dessus) reste pleinement
        // fonctionnel — aucun état bloqué, aucun contenu masqué.
        desktopTrigger = null;
      }
    }
  });
})();
