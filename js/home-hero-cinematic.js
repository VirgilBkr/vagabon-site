/**
 * VAGABON — js/home-hero-cinematic.js
 * ============================================================================
 * Home Hero cinématique (page d'accueil, index.html) — anime le calque
 * .home-hero__cinematic-layer (respiration idle, parallaxe scroll + souris).
 * Remplace en production l'ancien univers 3D Marble (iframe), entièrement
 * retiré du HTML et du CSS : il n'est plus chargé, affiché, masqué ni
 * conservé en repli nulle part sur cette page.
 *
 * Le calque est peint entièrement en CSS (voir css/pages/home.css,
 * .home-hero__cinematic-layer : background-image + position + inset) : ce
 * fichier n'ajoute jamais l'affichage lui-même, seulement des enrichissements
 * transform/opacity par-dessus. Si GSAP échoue à charger, si ce script
 * échoue, ou si prefers-reduced-motion est actif, le Hero reste pleinement
 * visible en repli statique — jamais bloqué par JavaScript.
 *
 * Repose sur GSAP + ScrollTrigger (bibliothèque déjà validée en Playground
 * avant cette promotion), chargés en <script defer> classique dans
 * index.html juste avant ce fichier. Aucune nouvelle dépendance.
 *
 * Note sur le parallaxe de scroll : index.html porte actuellement
 * <html class="is-landing-locked"> (page volontairement verrouillée sur un
 * seul écran, aucun contenu après le Hero aujourd'hui). Le ScrollTrigger
 * ci-dessous est câblé correctement mais restera sans effet visible tant
 * que la page ne comporte aucun contenu défilable — ce fichier ne
 * déverrouille jamais le scroll ni n'ajoute de contenu de test,
 * contrairement au harnais Playground qui insérait un spacer temporaire
 * pour la démonstration (hors périmètre de production).
 *
 * Nettoyage : purement local à ce fichier (tweens, ScrollTrigger et
 * listener qu'il a lui-même créés) — jamais ScrollTrigger.killAll(), qui
 * affecterait aussi d'éventuels autres usages de GSAP ailleurs sur le site.
 * ============================================================================
 */
(function () {
  "use strict";

  var heroEl = document.getElementById("home-hero");
  var layer = document.querySelector("[data-hero-cinematic-layer]");

  // Rien à animer : le calque reste affiché tel quel via CSS (repli
  // statique), aucune erreur, aucun blocage du reste de la page.
  if (!heroEl || !layer) return;

  var isCoarsePointer = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  var reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  var tweens = [];
  var triggers = [];
  var listeners = [];

  function addListener(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    listeners.push({ target: target, type: type, fn: fn, opts: opts });
  }

  // Nettoyage local et ciblé : ne tue que ce que CE fichier a créé. Ne
  // touche jamais à un autre tween/ScrollTrigger éventuellement présent
  // ailleurs sur le site — pas de ScrollTrigger.killAll().
  function cleanup() {
    tweens.forEach(function (t) { t.kill(); });
    tweens = [];
    triggers.forEach(function (t) { t.kill(); });
    triggers = [];
    listeners.forEach(function (l) { l.target.removeEventListener(l.type, l.fn, l.opts); });
    listeners = [];
  }

  function run() {
    cleanup();

    var gsap = window.gsap;
    if (!gsap) return; // GSAP indisponible : repli statique pur (CSS déjà affiché)

    // Repart d'un état de transform neutre à chaque (ré)exécution — évite
    // qu'un résidu (ex. décalage laissé par le parallaxe souris) persiste
    // après un changement de prefers-reduced-motion en cours de session.
    gsap.set(layer, { scale: 1, x: 0, y: 0, xPercent: 0, yPercent: 0 });

    var ScrollTrigger = window.ScrollTrigger || null;
    var reduced = !!(reducedMotionQuery && reducedMotionQuery.matches);

    if (reduced) {
      // Rendu statique propre : léger cadrage resserré, aucune animation.
      gsap.set(layer, { scale: 1.04 });
      return;
    }

    // Respiration atmosphérique idle — amplitude volontairement discrète.
    tweens.push(
      gsap.to(layer, {
        scale: 1.06,
        duration: 14,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      })
    );

    // Parallaxe de scroll (voir note en tête de fichier).
    if (ScrollTrigger) {
      triggers.push(
        ScrollTrigger.create({
          trigger: heroEl,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
          onUpdate: function (self) {
            gsap.set(layer, { y: self.progress * -60 });
          }
        })
      );
    }

    // Micro-parallaxe souris — desktop uniquement (ignoré sur tactile),
    // amplitude très faible.
    if (!isCoarsePointer) {
      var quickX = gsap.quickTo(layer, "xPercent", { duration: 0.9, ease: "power3.out" });
      var quickY = gsap.quickTo(layer, "yPercent", { duration: 0.9, ease: "power3.out" });
      var onPointerMove = function (e) {
        var rect = heroEl.getBoundingClientRect();
        var nx = (e.clientX - rect.left) / rect.width - 0.5;
        var ny = (e.clientY - rect.top) / rect.height - 0.5;
        quickX(nx * -2.4);
        quickY(ny * -2.4);
      };
      addListener(heroEl, "pointermove", onPointerMove);
    }
  }

  run();

  // Réagit à un changement du réglage système pendant la session en cours
  // (bascule vers/depuis le rendu statique, sans recharger la page).
  if (reducedMotionQuery) {
    var onReducedMotionChange = function () { run(); };
    if (reducedMotionQuery.addEventListener) reducedMotionQuery.addEventListener("change", onReducedMotionChange);
    else if (reducedMotionQuery.addListener) reducedMotionQuery.addListener(onReducedMotionChange);
  }
})();
