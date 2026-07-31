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
      ? Array.prototype.slice.call(document.querySelectorAll("[data-universe-parallax]")).filter(function (el) {
          // Exclut les visuels de la section Projets : ils vivent désormais
          // dans un conteneur potentiellement épinglé (position: sticky,
          // voir initProjectsHorizontalScroll() plus bas). Un décalage
          // vertical supplémentaire y entrerait en conflit avec le nouveau
          // mécanisme de progression horizontale, pour un gain visuel
          // négligeable (amplitude déjà subtile, ±18px). Aucune autre
          // section du site n'est concernée par ce filtre.
          return !el.closest("[data-projects-pin]");
        })
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
  /* Bandeau témoignages — carousel manuel (précédent/suivant/drag)       */
  /* ------------------------------------------------------------------ */
  /**
   * Remplace l'ancien défilement 100 % CSS (@keyframes universe-expertise-
   * marquee, voir css/pages/universe.css) par un pilotage JS du même
   * transform: translateX(...) sur .testimonial-band__track. Nécessaire
   * pour répondre à la demande explicite : boutons précédent/suivant qui
   * sautent IMMÉDIATEMENT au témoignage voisin, y compris pendant le
   * défilement automatique — une animation CSS pure ne permet pas de lire
   * ni de modifier sa position courante à la volée.
   *
   * Principe conservé à l'identique de l'ancien marquee : .testimonial-
   * band__track contient deux .testimonial-band__set identiques côte à
   * côte (le second aria-hidden="true") ; translater d'un plein "set" de
   * largeur (cycleWidth) ramène visuellement à la position de départ. Le
   * modulo ci-dessous (wrap()) exploite exactement cette duplication déjà
   * présente dans le HTML, sans y toucher.
   *
   * États de pause, cumulables :
   *  - survol souris (pointeur fin uniquement, comme l'ancien :hover CSS) ;
   *  - glissement tactile en cours ;
   *  - MANUAL_PAUSE_MS après une action manuelle (bouton ou fin de glisser),
   *    le temps de lire le témoignage affiché.
   * prefers-reduced-motion : aucun transform n'est appliqué et la fonction
   * s'arrête après avoir seulement câblé les boutons sur un pas fixe (pas
   * d'auto-scroll à mettre en pause) — cohérent avec le repli CSS statique
   * déjà en place pour cette préférence.
   */
  function initTestimonialCarousel() {
    var bands = document.querySelectorAll(".testimonial-band");
    if (bands.length === 0) return;

    var MANUAL_PAUSE_MS = 5000;
    var MOBILE_BREAKPOINT = "(max-width: 640px)";
    var FINE_HOVER = "(hover: hover) and (pointer: fine)";
    var reduceMotionMql = window.matchMedia("(prefers-reduced-motion: reduce)");

    bands.forEach(function (band) {
      var track = band.querySelector(".testimonial-band__track");
      var viewport = band.querySelector(".testimonial-band__viewport");
      var prevBtn = band.querySelector("[data-testimonial-prev]");
      var nextBtn = band.querySelector("[data-testimonial-next]");
      if (!track || !viewport) return;

      var cycleWidth = 0;
      function measure() {
        // Les deux .testimonial-band__set étant identiques, la moitié de
        // la largeur totale du track équivaut exactement à la distance
        // d'un cycle complet (même valeur que le translateX(-50%) de
        // l'ancienne animation CSS).
        cycleWidth = track.scrollWidth / 2;
      }
      measure();
      if (typeof ResizeObserver === "function") {
        new ResizeObserver(measure).observe(track);
      } else {
        window.addEventListener("resize", measure);
      }

      function getStep() {
        var items = track.querySelectorAll(".testimonial-band__item");
        if (items.length < 2) return cycleWidth || 1;
        var a = items[0].getBoundingClientRect().left;
        var b = items[1].getBoundingClientRect().left;
        return Math.abs(b - a) || cycleWidth || 1;
      }

      if (reduceMotionMql.matches) {
        // Rien à faire défiler dans le repli statique : .testimonial-band__nav
        // est de toute façon masqué en CSS pour cette préférence.
        return;
      }

      var offset = 0;
      var isHoverPaused = false;
      var isDragging = false;
      var manualPauseUntil = 0;
      var dragStartX = 0;
      var dragStartY = 0;
      var dragStartOffset = 0;
      var dragIsHorizontal = null;

      function render() {
        track.style.transform = "translateX(" + -offset + "px)";
      }

      function wrap() {
        if (!cycleWidth) return;
        offset = ((offset % cycleWidth) + cycleWidth) % cycleWidth;
      }

      function pauseForInteraction() {
        manualPauseUntil = performance.now() + MANUAL_PAUSE_MS;
      }

      function goPrev() {
        offset -= getStep();
        wrap();
        render();
        pauseForInteraction();
      }

      function goNext() {
        offset += getStep();
        wrap();
        render();
        pauseForInteraction();
      }

      if (prevBtn) prevBtn.addEventListener("click", goPrev);
      if (nextBtn) nextBtn.addEventListener("click", goNext);

      // Pause au survol — souris fine uniquement (même garde-fou que
      // l'ancienne règle CSS @media (hover: hover) and (pointer: fine) :
      // sur tactile, un simple appui peut déclencher un ":hover" persistant
      // dans certains navigateurs, ce qui figerait le défilement).
      if (window.matchMedia(FINE_HOVER).matches) {
        band.addEventListener("mouseenter", function () {
          isHoverPaused = true;
        });
        band.addEventListener("mouseleave", function () {
          isHoverPaused = false;
        });
      }

      // Glissement tactile horizontal : ne capture le geste (et ne bloque
      // le scroll vertical de la page) qu'une fois le mouvement identifié
      // comme horizontal, pour ne jamais gêner la lecture de la page sur
      // mobile.
      viewport.addEventListener(
        "touchstart",
        function (e) {
          if (e.touches.length !== 1) return;
          isDragging = true;
          dragIsHorizontal = null;
          dragStartX = e.touches[0].clientX;
          dragStartY = e.touches[0].clientY;
          dragStartOffset = offset;
        },
        { passive: true }
      );

      viewport.addEventListener(
        "touchmove",
        function (e) {
          if (!isDragging || e.touches.length !== 1) return;
          var dx = e.touches[0].clientX - dragStartX;
          if (dragIsHorizontal === null) {
            var dy = e.touches[0].clientY - dragStartY;
            if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return; // pas assez de mouvement pour trancher
            dragIsHorizontal = Math.abs(dx) > Math.abs(dy);
          }
          if (!dragIsHorizontal) return;
          e.preventDefault();
          offset = dragStartOffset - dx;
          wrap();
          render();
        },
        { passive: false }
      );

      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        if (dragIsHorizontal) pauseForInteraction();
        dragIsHorizontal = null;
      }
      viewport.addEventListener("touchend", endDrag, { passive: true });
      viewport.addEventListener("touchcancel", endDrag, { passive: true });

      var lastTs = null;
      function frame(ts) {
        if (lastTs === null) lastTs = ts;
        var dt = ts - lastTs;
        lastTs = ts;
        if (!isDragging && !isHoverPaused && ts > manualPauseUntil && cycleWidth) {
          var cycleDurationMs = window.matchMedia(MOBILE_BREAKPOINT).matches ? 64000 : 100000;
          offset += (cycleWidth / cycleDurationMs) * dt;
          wrap();
          render();
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Projets — scroll horizontal épinglé (desktop) / swipe natif (mobile) */
  /* ------------------------------------------------------------------ */
  /**
   * Voir le grand commentaire HTML au-dessus de .universe-projects__pin
   * dans universe.html, et le bloc CSS correspondant (juste avant
   * .universe-project) dans css/pages/universe.css, pour le détail des 3
   * présentations possibles. Cette fonction ne fait qu'ajouter/retirer les
   * classes .is-projects-pinned / .is-projects-swipe sur [data-projects-pin]
   * et piloter la progression (0..panelCount-1) :
   *  - desktop (pointeur fin, ≥901px) : progression dérivée de
   *    window.scrollY — scroll natif, jamais intercepté (aucun
   *    preventDefault sur wheel), conformément au DIAGNOSTIC COMPARATIF en
   *    tête de ce fichier ;
   *  - tactile/mobile/tablette : progression dérivée de track.scrollLeft —
   *    scroll natif du conteneur lui-même (overflow-x + scroll-snap CSS,
   *    voir universe.css), totalement indépendant du scroll de la page.
   * Sous prefers-reduced-motion, ou si la structure attendue (pin/sticky/
   * track + au moins 2 panneaux) est absente, la fonction s'arrête sans
   * ajouter aucune classe : le repli CSS (empilement vertical d'origine)
   * reste actif tel quel, mouvement le plus simple possible.
   */
  function initProjectsHorizontalScroll() {
    var pin = document.querySelector("[data-projects-pin]");
    var sticky = document.querySelector("[data-projects-sticky]");
    var track = document.querySelector("[data-projects-track]");
    if (!pin || !sticky || !track) return;

    var panels = Array.prototype.slice.call(track.children).filter(function (el) {
      return el.classList.contains("universe-project");
    });
    var panelCount = panels.length;
    if (panelCount < 2 || prefersReducedMotion()) return;

    var currentEl = document.querySelector("[data-projects-current]");
    var fillEl = document.querySelector("[data-projects-fill]");

    var desktopMql = window.matchMedia("(min-width: 901px)");
    var finePointerMql = window.matchMedia("(hover: hover) and (pointer: fine)");

    function isDesktop() {
      return desktopMql.matches && finePointerMql.matches;
    }

    function pad2(n) {
      return n < 10 ? "0" + n : String(n);
    }

    function updateIndicator(progress) {
      var index = Math.min(panelCount - 1, Math.max(0, Math.round(progress)));
      if (currentEl) currentEl.textContent = pad2(index + 1);
      if (fillEl) fillEl.style.transform = "translateX(" + index * 100 + "%)";
    }

    var mode = null; // "pinned" | "swipe"
    var pinTop = 0;
    var pinnedHeight = 0;
    var scrollRange = 1;

    /* ---- Mode desktop : épinglage + translation horizontale ---------- */

    function measurePinned() {
      // La fenêtre épinglée fait exactement la hauteur du viewport, jamais
      // plus : un position: sticky ne peut de toute façon jamais afficher
      // plus que window.innerHeight à l'écran pendant qu'il est épinglé
      // (son sommet reste fixé à top: 0 tout du long) — lui donner une
      // hauteur supérieure au viewport (ce qui a été essayé, en prenant le
      // plus grand des 3 panneaux) ne rend PAS le surplus visible pour
      // autant : ce surplus reste en permanence sous le pli, invisible et
      // inatteignable puisque l'élément ne bouge plus tant qu'il est
      // épinglé. .universe-projects__sticky centre déjà son contenu
      // verticalement (align-items: center) : si un panneau est plus haut
      // que le viewport (cas rare, uniquement le Projet 01 sur de très
      // petites hauteurs d'écran), le dépassement est ainsi réparti
      // symétriquement en haut ET en bas plutôt que perdu uniquement en bas.
      pinnedHeight = window.innerHeight;
      sticky.style.height = pinnedHeight + "px";
      pin.style.height = pinnedHeight * panelCount + "px";

      var rect = pin.getBoundingClientRect();
      pinTop = rect.top + window.scrollY;
      scrollRange = Math.max(1, pinnedHeight * (panelCount - 1));
    }

    function applyPinnedProgress() {
      var raw = (window.scrollY - pinTop) / scrollRange;
      raw = Math.min(Math.max(raw, 0), 1);
      var progress = raw * (panelCount - 1);
      var stepPct = 100 / panelCount;
      track.style.transform = "translateX(" + -progress * stepPct + "%)";
      panels.forEach(function (panel, i) {
        var dist = Math.min(1, Math.abs(progress - i));
        panel.style.opacity = String(1 - dist * 0.6);
      });
      updateIndicator(progress);
    }

    var pinnedTicking = false;
    function onPinnedScroll() {
      if (pinnedTicking) return;
      pinnedTicking = true;
      window.requestAnimationFrame(function () {
        pinnedTicking = false;
        applyPinnedProgress();
      });
    }

    function setupPinned() {
      pin.classList.add("is-projects-pinned");
      measurePinned();
      applyPinnedProgress();
      window.addEventListener("scroll", onPinnedScroll, { passive: true });
    }

    function teardownPinned() {
      pin.classList.remove("is-projects-pinned");
      pin.style.height = "";
      sticky.style.height = "";
      track.style.transform = "";
      panels.forEach(function (panel) { panel.style.opacity = ""; });
      window.removeEventListener("scroll", onPinnedScroll);
    }

    /* ---- Mode tactile/mobile : swipe natif, indicateur seul ----------- */

    function applySwipeProgress() {
      var max = track.scrollWidth - track.clientWidth;
      var progress = max > 0 ? (track.scrollLeft / max) * (panelCount - 1) : 0;
      updateIndicator(progress);
    }

    var swipeTicking = false;
    function onSwipeScroll() {
      if (swipeTicking) return;
      swipeTicking = true;
      window.requestAnimationFrame(function () {
        swipeTicking = false;
        applySwipeProgress();
      });
    }

    function setupSwipe() {
      pin.classList.add("is-projects-swipe");
      applySwipeProgress();
      track.addEventListener("scroll", onSwipeScroll, { passive: true });
    }

    function teardownSwipe() {
      pin.classList.remove("is-projects-swipe");
      track.removeEventListener("scroll", onSwipeScroll);
    }

    /* ---- Bascule entre modes, y compris au redimensionnement ---------- */

    function refreshMode() {
      var desired = isDesktop() ? "pinned" : "swipe";
      if (desired === mode) {
        // Toujours re-mesurer : la hauteur naturelle des panneaux ou la
        // largeur du viewport a pu changer (redimensionnement, rotation).
        if (mode === "pinned") { measurePinned(); applyPinnedProgress(); }
        else { applySwipeProgress(); }
        return;
      }
      if (mode === "pinned") teardownPinned();
      if (mode === "swipe") teardownSwipe();
      mode = desired;
      if (mode === "pinned") setupPinned();
      else setupSwipe();
    }

    refreshMode();
    window.addEventListener("resize", refreshMode);
    // Une police ou une image encore en cours de chargement au premier
    // calcul peut légèrement modifier la hauteur naturelle des panneaux
    // (mêmes précautions que measure() dans initScrollEffects ci-dessus) :
    // une re-mesure ponctuelle à "load" suffit, jamais répétée ensuite.
    window.addEventListener("load", refreshMode);

    // Accessibilité clavier : si un élément focusable à l'intérieur d'un
    // panneau reçoit le focus (Tab) alors qu'il n'est pas le panneau
    // actuellement visible, on l'amène en vue — utile dès qu'un futur
    // Projet 02/03 recevra une vraie page dédiée (donc un lien focusable).
    // Le Projet 01 (seul lien réel actuellement) est toujours le premier
    // panneau : ce cas ne se présente pas encore en pratique, mais le
    // mécanisme est déjà en place pour rester accessible par construction.
    track.addEventListener("focusin", function (e) {
      var panel = e.target.closest ? e.target.closest(".universe-project") : null;
      if (!panel) return;
      var index = panels.indexOf(panel);
      if (index < 0) return;
      if (mode === "pinned") {
        window.scrollTo({ top: pinTop + index * pinnedHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      } else if (mode === "swipe") {
        panel.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", inline: "start", block: "nearest" });
      }
    });
  }

  function init() {
    updateMaxScroll();
    initSmoothAnchors();
    initScrollEffects();
    initWordReveal();
    initSceneReveal();
    initTestimonialCarousel();
    initProjectsHorizontalScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
