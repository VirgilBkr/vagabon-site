/**
 * VAGABON — js/universe-cursor.js
 * Curseur personnalisé "éclat de glace" — page portfolio (universe.html)
 * UNIQUEMENT. Ce fichier n'est chargé QUE par universe.html : il n'a donc
 * strictement aucun effet sur la landing page (index.html), qui garde son
 * curseur natif intact. Garde-fou supplémentaire ci-dessous (classe
 * body.page-universe) au cas où ce script serait un jour chargé ailleurs.
 *
 * Désactivé entièrement (curseur natif conservé, aucun élément créé, aucun
 * listener posé) si :
 * - prefers-reduced-motion: reduce ;
 * - pointeur tactile/grossier (mobile, tablette) ;
 * - requestAnimationFrame indisponible.
 *
 * Performance : une seule boucle requestAnimationFrame, des listeners
 * passifs qui ne font que stocker des nombres (aucune lecture de mise en
 * page — aucun getBoundingClientRect — dans les handlers ni dans la
 * boucle), un pool FIXE de particules DOM réutilisées pour les éclats de
 * clic (jamais de création/suppression continue de nœuds), et uniquement
 * des animations de transform/opacity — jamais de propriété qui déclenche
 * un recalcul de mise en page. Aucun listener de scroll/wheel, aucun
 * preventDefault, aucune bibliothèque ajoutée.
 *
 * NOTE : l'effet de déformation locale de l'image du Hero au passage du
 * curseur vit dans un fichier séparé, js/universe-hero-distortion.js — un
 * petit module WebGL entièrement indépendant, scopé à #universe-intro, qui
 * ne modifie rien ici. Une première tentative avec backdrop-filter + un
 * filtre SVG feDisplacementMap s'est révélée non fiable (le filtre existait
 * dans le DOM sans jamais produire de déformation visible dans un vrai
 * navigateur) et a été retirée.
 */
(function () {
  "use strict";

  if (!document.body.classList.contains("page-universe")) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (reduceMotion || coarsePointer || !window.requestAnimationFrame) return;

  function init() {
    // ---- Curseur (fragment de glace + halo) -------------------------------
    var cursor = document.createElement("div");
    cursor.className = "universe-ice-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML =
      '<div class="universe-ice-cursor__halo"></div>' +
      '<svg class="universe-ice-cursor__shard" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">' +
        // Six facettes taillées façon pierre précieuse, chacune avec sa
        // propre teinte/opacité (blanc lumineux, bleu pâle, bleu profond en
        // ombre) : c'est cette variation entre faces qui donne l'impression
        // de volume/réfraction, plutôt qu'un dégradé unique plat.
        '<path d="M24 2 L24 14.5 L11 14 Z" fill="rgba(255,255,255,0.92)"/>' +
        '<path d="M24 2 L35 15 L24 14.5 Z" fill="rgba(214,238,251,0.82)"/>' +
        '<path d="M24 14.5 L11 14 L15 30 L24 31 Z" fill="rgba(255,255,255,0.4)"/>' +
        '<path d="M24 14.5 L24 31 L31 32 L35 15 Z" fill="rgba(27,132,190,0.6)"/>' +
        '<path d="M24 31 L15 30 L24 46 Z" fill="rgba(205,230,248,0.62)"/>' +
        '<path d="M24 31 L24 46 L31 32 Z" fill="rgba(14,90,125,0.68)"/>' +
        // Contour bleu glacier soutenu : garantit la lisibilité de la
        // silhouette même là où le remplissage translucide se fond dans le
        // fond clair du Hero (#AEC8D8).
        '<path d="M24 2 L35 15 L31 32 L24 46 L15 30 L11 14 Z" fill="none" stroke="#073C54" stroke-width="2.5" stroke-linejoin="round"/>' +
        // Arêtes internes plus marquées (lignes de structure entre les
        // facettes) pour renforcer la sensation de cristal taillé.
        '<path d="M24 2 L24 46 M11 14 L35 15 M15 30 L31 32" stroke="rgba(7,60,84,0.7)" stroke-width="1.1" fill="none"/>' +
        // Reflet blanc net (glint) pour la brillance/luminosité interne.
        '<path d="M24 6 L28.5 15 L24 26.5 L19.5 15 Z" fill="rgba(255,255,255,0.6)" stroke="rgba(255,255,255,0.8)" stroke-width="0.5"/>' +
        '<path d="M19.5 17 L24 14.5 L21.5 24 Z" fill="rgba(255,255,255,0.4)"/>' +
      "</svg>";
    document.body.appendChild(cursor);

    var shard = cursor.querySelector(".universe-ice-cursor__shard");

    // ---- Conteneur des éclats de clic (pool DOM, ponctuel) -----------------
    var vaporField = document.createElement("div");
    vaporField.className = "universe-ice-cursor__vapor";
    vaporField.setAttribute("aria-hidden", "true");
    var CRYSTAL_POOL_SIZE = 4;
    var crystalParticles = [];
    for (var c = 0; c < CRYSTAL_POOL_SIZE; c++) {
      var cp = document.createElement("span");
      cp.className = "universe-ice-cursor__crystal";
      vaporField.appendChild(cp);
      crystalParticles.push(cp);
    }
    document.body.appendChild(vaporField);

    document.documentElement.classList.add("has-ice-cursor");

    // ---- État ---------------------------------------------------------------
    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var curX = targetX;
    var curY = targetY;
    var prevX = targetX;
    var prevY = targetY;
    var angle = -20;
    var scaleX = 1;
    var scaleY = 1;
    var hoverMul = 1;
    var activeMul = 1;
    var isHover = false;
    var isActive = false;
    var crystalIndex = 0;
    var lastFrameAt = performance.now();

    function onMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;
    }
    window.addEventListener("mousemove", onMove, { passive: true });

    var HOVER_SELECTOR =
      "a, button, input, textarea, select, [role='button'], .c-btn, .c-icon-btn, " +
      ".c-menu-toggle, .universe-cta, .universe-project__discover, .universe-nav__back, " +
      "[data-menu-close], .c-nav-fullscreen__link";

    function onOver(e) {
      if (e.target && e.target.closest && e.target.closest(HOVER_SELECTOR)) {
        isHover = true;
        cursor.classList.add("is-hover");
      }
    }
    function onOut(e) {
      if (e.target && e.target.closest && e.target.closest(HOVER_SELECTOR)) {
        isHover = false;
        cursor.classList.remove("is-hover");
      }
    }
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseout", onOut, { passive: true });

    function spawnCrystalBurst(x, y) {
      var count = 2 + Math.floor(Math.random() * 3); // 2 à 4 éclats
      for (var k = 0; k < count; k++) {
        var el = crystalParticles[crystalIndex];
        crystalIndex = (crystalIndex + 1) % crystalParticles.length;
        var burstAngle = Math.random() * Math.PI * 2;
        var dist = 14 + Math.random() * 12;
        el.style.setProperty("--vx", (Math.cos(burstAngle) * dist).toFixed(1) + "px");
        el.style.setProperty("--vy", (Math.sin(burstAngle) * dist).toFixed(1) + "px");
        el.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
        el.classList.remove("is-fading");
        void el.offsetWidth;
        el.style.animationDuration = "420ms";
        el.classList.add("is-fading");
      }
    }

    function onDown() {
      isActive = true;
      cursor.classList.add("is-active");
      spawnCrystalBurst(curX, curY);
    }
    function onUp() {
      isActive = false;
      cursor.classList.remove("is-active");
    }
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });

    // Masqué proprement quand le pointeur quitte la fenêtre, pour éviter un
    // fragment figé visible au bord de l'écran.
    document.addEventListener(
      "mouseleave",
      function () {
        cursor.classList.add("is-idle");
      },
      { passive: true }
    );
    document.addEventListener(
      "mouseenter",
      function () {
        cursor.classList.remove("is-idle");
      },
      { passive: true }
    );

    function frame(now) {
      var dt = Math.max(now - lastFrameAt, 1);
      lastFrameAt = now;

      // Inertie légère vers la position réelle du pointeur.
      curX += (targetX - curX) * 0.18;
      curY += (targetY - curY) * 0.18;

      var vx = (curX - prevX) / dt;
      var vy = (curY - prevY) / dt;
      var speed = Math.min(Math.sqrt(vx * vx + vy * vy) * 18, 1);

      if (speed > 0.05) {
        var targetAngle = Math.atan2(vy, vx) * (180 / Math.PI);
        var diff = targetAngle - angle;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        angle += diff * 0.12;
      }

      var targetScaleX = 1 + speed * 0.2;
      var targetScaleY = 1 - speed * 0.1;
      scaleX += (targetScaleX - scaleX) * 0.2;
      scaleY += (targetScaleY - scaleY) * 0.2;

      var targetHoverMul = isHover ? 1.45 : 1;
      hoverMul += (targetHoverMul - hoverMul) * 0.18;
      var targetActiveMul = isActive ? 0.72 : 1;
      activeMul += (targetActiveMul - activeMul) * 0.3;

      cursor.style.transform = "translate3d(" + curX + "px, " + curY + "px, 0)";
      shard.style.transform =
        "rotate(" + angle.toFixed(2) + "deg) scale(" +
        (scaleX * hoverMul * activeMul).toFixed(3) + ", " +
        (scaleY * hoverMul * activeMul).toFixed(3) + ")";

      prevX = curX;
      prevY = curY;

      window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  // Le curseur natif ne doit jamais rester masqué si la création du curseur
  // personnalisé échoue pour une raison quelconque — la classe qui masque le
  // curseur natif (voir CSS, html.has-ice-cursor) n'est ajoutée qu'à
  // l'intérieur de init(), après la création réelle de l'élément.
  function safeInit() {
    try {
      init();
    } catch (err) {
      document.documentElement.classList.remove("has-ice-cursor");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeInit);
  } else {
    safeInit();
  }
})();
