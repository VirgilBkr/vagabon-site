/**
 * VAGABON — js/universe.js
 * Comportements de scroll et de transition propres à universe.html
 * (l'expérience éditoriale ouverte depuis le bouton « Entrer dans l'univers »
 * de la landing page). Ne s'exécute que sur cette page : ne modifie ni
 * index.html, ni aucun composant partagé. Le système générique de
 * révélation au scroll ([data-reveal], IntersectionObserver) reste géré
 * par js/animations.js, déjà chargé sur toutes les pages — ce fichier
 * n'ajoute que ce qui est spécifique à cette page :
 * - une révélation "mot par mot" pour les grands titres ;
 * - une entrée en scène (léger scale + fondu) pour les grandes sections ;
 * - la barre de progression et le parallax des visuels de projet.
 *
 * OPTIMISATION PERFORMANCE : la barre de progression et le parallax sont
 * fusionnés dans initScrollEffects() et n'effectuent plus aucune lecture
 * de mise en page (getBoundingClientRect / scrollHeight) pendant le
 * scroll — voir le commentaire détaillé sur maxScrollValue et sur
 * initScrollEffects() plus bas pour le diagnostic complet.
 *
 * DIAGNOSTIC COMPARATIF (scroll saccadé signalé après ajout des visuels) :
 * comparé à l'état initial de cette page — scroll 100% natif, adouci
 * uniquement par `scroll-behavior: smooth` dans css/reset.css (partagé,
 * zéro JS, zéro coût) — la version précédente de ce fichier ajoutait un
 * scroll adouci "maison" qui interceptait CHAQUE événement wheel avec
 * `event.preventDefault()` puis pilotait `window.scrollTo()` via une
 * boucle requestAnimationFrame (lerp manuel). Cette architecture remplace
 * le scroll natif au lieu de l'accompagner : sur trackpad en particulier,
 * l'inertie propre à macOS continue d'émettre des événements wheel après
 * la fin du geste, et la boucle JS doit re-cibler une position qui bouge
 * encore — d'où la sensation de résistance/à-coups en cas de changement
 * de direction rapide. Ce mécanisme a été retiré : le scroll est de
 * nouveau entièrement natif (molette, trackpad, clavier, tactile), donc
 * fluide par construction. Les animations visuelles pilotées par lecture
 * passive du scroll (parallax, barre de progression, révélations
 * mot-par-mot / en scène / des projets) sont conservées à l'identique :
 * elles n'ont jamais interféré avec le scroll lui-même.
 */

(function () {
  "use strict";

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isFinePointerDesktop() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  /* ------------------------------------------------------------------ */
  /* Métriques de page mises en cache                                     */
  /* ------------------------------------------------------------------ */
  /**
   * DIAGNOSTIC (voir la demande) : la cause du ralentissement au scroll
   * n'était pas les images (aucune n'est encore présente dans le projet)
   * mais un schéma classique de "layout thrashing" : plusieurs fonctions
   * lisaient `getBoundingClientRect()` et `document.documentElement.
   * scrollHeight` — deux propriétés qui forcent un recalcul de layout
   * synchrone si l'affichage n'est pas à jour — À CHAQUE image de défilement
   * (jusqu'à 60 fois/seconde), pendant que d'autres fonctions écrivaient
   * `style.transform` / `style.width` juste avant dans la même image. Ce
   * cycle lecture/écriture entrelacé forçait un recalcul de mise en page
   * complet à chaque frame, exactement le genre de coût qui devient plus
   * visible dès que la page contient plus de contenu visuel.
   *
   * CORRECTIF : ces lectures coûteuses ne sont plus faites pendant le
   * scroll. Elles sont calculées une seule fois ici (au chargement et au
   * redimensionnement, deux événements rares), puis stockées ; pendant le
   * scroll, seule la lecture de `window.scrollY` est utilisée (une
   * propriété bon marché, suivie par le compositeur du navigateur, qui ne
   * force jamais de recalcul de mise en page) combinée à de l'arithmétique
   * simple. Le rendu visuel est strictement identique.
   */
  var maxScrollValue = 0;

  function updateMaxScroll() {
    maxScrollValue = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  /* ------------------------------------------------------------------ */
  /* Défilement doux vers les ancres internes du menu                     */
  /* ------------------------------------------------------------------ */
  /**
   * Le scroll continu (molette, trackpad, clavier, tactile) est laissé
   * entièrement natif — voir le DIAGNOSTIC COMPARATIF en tête de fichier.
   * Seul le saut vers une ancre interne (clic sur un lien de menu) est
   * adouci ici, via l'API native scrollIntoView({behavior:"smooth"}),
   * qui délègue l'animation au navigateur lui-même (aucun lerp maison,
   * aucune interception de wheel, aucun coût pendant le scroll normal).
   */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      if (!id) return;
      link.addEventListener("click", function (event) {
        var target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Effets pilotés par le scroll : barre de progression + parallax        */
  /* ------------------------------------------------------------------ */
  /**
   * Fusionnés dans une seule fonction (un seul écouteur "scroll", un seul
   * tick requestAnimationFrame) : c'est ici que se trouvait la cause
   * principale du ralentissement (voir le commentaire sur maxScrollValue
   * plus haut). Corrections apportées :
   * - la position de chaque visuel de projet est désormais mesurée UNE
   *   FOIS (au chargement + au redimensionnement), jamais pendant le
   *   scroll — on se contente ensuite d'une soustraction avec
   *   window.scrollY à chaque frame (aucune lecture de mise en page) ;
   * - la hauteur totale de la page (pour la barre de progression) utilise
   *   la même valeur mise en cache (maxScrollValue) que le scroll adouci,
   *   au lieu d'être recalculée à chaque frame ;
   * - toutes les lectures ont lieu avant toutes les écritures dans le même
   *   tick, ce qui élimine tout risque de "layout thrashing" avec les
   *   autres scripts de la page.
   * Rendu visuel strictement identique à avant (mêmes amplitudes, mêmes
   * seuils, même barre de progression).
   */
  function initScrollEffects() {
    var bar = document.querySelector("[data-progress-live]");
    var parallaxEnabled = !prefersReducedMotion() && isFinePointerDesktop();
    var items = parallaxEnabled
      ? Array.prototype.slice.call(document.querySelectorAll("[data-universe-parallax]"))
      : [];

    if (!bar && items.length === 0) return;

    // Position de chaque élément relative au DOCUMENT (pas au viewport) :
    // calculée une seule fois via getBoundingClientRect ici (lecture rare,
    // hors du chemin critique du scroll), puis combinée à window.scrollY
    // (lecture bon marché) à chaque frame pour retrouver sa position
    // actuelle à l'écran sans jamais re-déclencher de calcul de mise en page.
    var parallaxOffsets = [];
    var ticking = false;

    function measure() {
      updateMaxScroll();
      if (items.length > 0) {
        var scrollNow = window.scrollY;
        parallaxOffsets = items.map(function (el) {
          var rect = el.getBoundingClientRect();
          return { el: el, top: rect.top + scrollNow, height: rect.height };
        });
      }
    }

    function update() {
      var scrollNow = window.scrollY; // lecture bon marché, jamais de layout forcé
      var viewportH = window.innerHeight;

      if (bar) {
        var ratio = maxScrollValue > 0 ? Math.min(Math.max(scrollNow / maxScrollValue, 0), 1) : 0;
        bar.style.width = (ratio * 100) + "%";
      }

      parallaxOffsets.forEach(function (item) {
        var rectTop = item.top - scrollNow; // équivalent à getBoundingClientRect().top, sans le coût
        var centre = rectTop + item.height / 2;
        var distanceFromCentre = (centre - viewportH / 2) / viewportH;
        var shift = distanceFromCentre * -18; // amplitude en pixels, inchangée
        item.el.style.transform = "translateY(" + shift.toFixed(2) + "px)";
      });

      ticking = false;
    }

    function requestTick() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }

    measure();
    update();

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", function () {
      measure();
      update();
    });
    // Les images des projets utilisent loading="lazy" : leur chargement ne
    // modifie pas la hauteur de page (aspect-ratio déjà réservé en CSS),
    // mais les polices/contenus peuvent encore décaler la mise en page une
    // fois la page totalement chargée — une re-mesure ponctuelle suffit.
    window.addEventListener("load", measure);
  }

  /* ------------------------------------------------------------------ */
  /* Révélation "mot par mot" des grands titres ([data-word-reveal])      */
  /* ------------------------------------------------------------------ */
  /**
   * Découpe le texte d'un titre en mots, chacun enveloppé dans un masque
   * (overflow: hidden) contenant un span translaté verticalement — effet
   * "les mots montent depuis un cache" au lieu d'un simple fondu de bloc.
   * Le déclenchement réutilise la classe .is-visible déjà posée par
   * l'observateur générique [data-reveal] de js/animations.js (ces titres
   * portent aussi data-reveal) : aucun nouvel observateur nécessaire.
   *
   * Sous prefers-reduced-motion, ou si la structure du titre n'est pas un
   * simple texte, le découpage est purement et simplement ignoré : le
   * titre reste un texte normal, immédiatement lisible (dégradation
   * neutre, sémantique intacte pour les lecteurs d'écran).
   */
  function initWordReveal() {
    if (prefersReducedMotion()) return;

    var titles = document.querySelectorAll("[data-word-reveal]");
    titles.forEach(function (title) {
      var text = title.textContent.trim();
      if (!text) return;
      var words = text.split(/\s+/);
      if (words.length === 0) return;

      var STAGGER_MS = 38;
      var MAX_DELAY_MS = 420; // au-delà, tous les mots restants partagent le même délai plafond

      var html = words.map(function (word, index) {
        var delay = Math.min(index * STAGGER_MS, MAX_DELAY_MS);
        return (
          '<span class="u-word-mask">' +
            '<span class="u-word-mask__inner" style="transition-delay:' + delay + 'ms">' + word + "</span>" +
          "</span>"
        );
      }).join(" ");

      title.innerHTML = html;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Entrée "en scène" des grandes sections ([data-scene])                */
  /* ------------------------------------------------------------------ */
  /**
   * Léger scale + fondu à l'entrée de chaque grande section (distinct des
   * révélations internes plus fines de chaque élément) : adoucit la
   * frontière entre sections, comme demandé (aucune rupture brutale).
   * Observateur dédié, séparé de celui de [data-reveal] pour garder les
   * deux mécanismes indépendants et lisibles.
   */
  function initSceneReveal() {
    var items = document.querySelectorAll("[data-scene]");
    if (items.length === 0) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    try {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18, rootMargin: "0px 0px -10% 0px" });

      items.forEach(function (el) { observer.observe(el); });
    } catch (err) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
    }

    // Filet de sécurité, cohérent avec celui de js/animations.js : aucune
    // section ne doit rester invisible indéfiniment.
    window.setTimeout(function () {
      document.querySelectorAll("[data-scene]:not(.is-visible)").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }, 1800);
  }

  /* ------------------------------------------------------------------ */
  /* Bandeau témoignages — pause tactile ([data-marquee-touch-pause])     */
  /* ------------------------------------------------------------------ */
  /**
   * Le survol souris met déjà en pause .testimonial-band__track en CSS pur
   * (voir @media (hover: hover) and (pointer: fine) dans
   * css/pages/universe.css) — inutile en JS. Sur tactile, il n'existe pas
   * d'équivalent fiable au survol (voir le commentaire CSS à ce sujet) :
   * cette fonction ajoute donc une pause COURTE et explicite au toucher,
   * juste assez longue pour lire la phrase en cours, sans bloquer
   * indéfiniment le défilement ni ajouter de logique de swipe/scroll manuel
   * (demande explicite : rester simple). N'introduit aucun nouveau moteur
   * d'animation : bascule uniquement une classe CSS, l'animation elle-même
   * reste celle définie par .testimonial-band__track.
   */
  function initTestimonialTouchPause() {
    var bands = document.querySelectorAll(".testimonial-band");
    if (bands.length === 0 || !("ontouchstart" in window)) return;

    var RESUME_DELAY_MS = 4000;

    bands.forEach(function (band) {
      var resumeTimer = null;
      band.addEventListener(
        "touchstart",
        function () {
          band.classList.add("is-touch-paused");
          window.clearTimeout(resumeTimer);
          resumeTimer = window.setTimeout(function () {
            band.classList.remove("is-touch-paused");
          }, RESUME_DELAY_MS);
        },
        { passive: true }
      );
    });
  }

  function init() {
    updateMaxScroll();
    initSmoothAnchors();
    initScrollEffects();
    initWordReveal();
    initSceneReveal();
    initTestimonialTouchPause();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
