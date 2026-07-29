/**
 * VAGABON — js/universe-media-stack.js
 * Pile de médias glissable horizontalement — page portfolio (universe.html)
 * UNIQUEMENT. Fichier isolé, sans dépendance ni couplage avec
 * js/universe-cursor.js, js/universe-hero-distortion.js ou js/universe.js
 * (parallax, reveal, smooth-scroll) : il ne lit ni ne modifie rien dans ces
 * fichiers. Ne s'active que sur les éléments explicitement marqués
 * [data-project-stack] — actuellement le projet 01 uniquement ; les projets
 * 02/03/04 ne portent pas cet attribut et ne sont donc pas concernés.
 *
 * ARCHITECTURE (reconstruite) — deux états seulement, jamais plus :
 *
 *   IDLE      → aucune interaction en cours. Chaque carte est exactement à
 *               la position déterminée par sa profondeur dans `order`.
 *   DRAGGING  → un geste horizontal est en cours. SEULE la carte active et
 *               la suivante reçoivent un aperçu en direct (transform
 *               instantané, transition: none). Dès que le déplacement
 *               franchit le seuil, on bascule IMMÉDIATEMENT (pas d'attente
 *               de silence) vers un commit + verrouillage :
 *   LOCKED    → le tableau `order` vient de tourner, une unique animation
 *               de règlement (transition CSS) amène TOUTES les cartes à
 *               leur position exacte. Tant que ce verrou est actif, AUCUN
 *               nouvel événement de geste n'est pris en compte — il est
 *               ignoré, pas mis en file d'attente. Une fois la durée de
 *               règlement écoulée, un retour à IDLE est forcé, et l'état
 *               final exact est réécrit une dernière fois, indépendamment
 *               du déroulement visuel réel de la transition.
 *
 * C'est ce verrouillage — inexistant dans les versions précédentes — qui
 * empêche structurellement qu'un nouveau geste (ou la traîne inertielle
 * d'un trackpad) interrompe un règlement en cours : il n'y a plus besoin de
 * "deviner" quand un geste est terminé (l'ancien modèle attendait un
 * silence de 140ms avant de décider quoi que ce soit, ce qui, combiné à
 * l'inertie d'un trackpad, retardait la vraie décision et laissait
 * l'aperçu en direct dériver loin de sa cible pendant ce temps) : le
 * franchissement du seuil déclenche la décision SUR-LE-CHAMP.
 *
 * Source unique de vérité : `depthLayout(depth)` est une fonction pure qui
 * calcule la position/l'échelle/l'opacité d'UNE profondeur donnée,
 * uniquement à partir de son rang dans `order` — jamais à partir d'une
 * valeur résiduelle de transform. `render()` est le SEUL endroit du fichier
 * qui écrit l'état de repos des cartes, et ne peut être invoqué que depuis
 * IDLE (état initial/resize) ou lors du passage à LOCKED (commit/retour
 * élastique) : ces deux appels ne peuvent jamais se chevaucher, par
 * construction de la machine à états — pas besoin de garde a posteriori.
 *
 * Interaction tactile (doigt) : chaque pointeur commence sans intention
 * déterminée. Tant que le geste n'est pas clairement plus horizontal que
 * vertical (seuil de quelques pixels), rien n'est intercepté — le
 * défilement vertical natif de la page continue de fonctionner au doigt
 * normalement (aucun preventDefault, aucun listener de scroll ajouté). Ce
 * n'est qu'une fois l'intention horizontale confirmée que le geste est
 * capturé (setPointerCapture + preventDefault) pour cette interaction
 * précise. Reste scopé à la zone visuelle de la pile (comportement tactile
 * normal : on touche ce qu'on veut faire glisser). Un flick rapide (grande
 * vitesse, même sous le seuil de distance) déclenche aussi un commit — ce
 * cas a un relâchement explicite (pointerup), donc une vraie fin de geste.
 *
 * Interaction souris/trackpad — zone élargie, CONSERVÉE telle quelle : le
 * clic n'est plus nécessaire, et la zone d'écoute couvre tout le bloc du
 * projet (média + colonne de texte + espace vide), via
 * `stackEl.closest(".universe-project")` — un déplacement horizontal fait
 * avancer/reculer les cartes où que le curseur se trouve dans ce bloc. Le
 * clic-glisser tactile reste disponible en secondaire. Contrairement à
 * l'ancien modèle, il n'y a plus de délai d'attente pour décider d'un
 * commit : le franchissement du seuil décide instantanément, ce qui
 * élimine à la fois le délai ressenti ET le risque qu'une traîne
 * inertielle de trackpad fasse défiler plusieurs cartes (elle est bloquée
 * par le verrou LOCKED dès le premier commit).
 *
 * Zone protégée — média actif : seule exception à la zone élargie
 * ci-dessus. Tant que le pointeur se trouve directement au-dessus de la
 * carte actuellement active (`.universe-project__stack-card.is-active`,
 * jamais codé en dur pour un média en particulier — suit `order[0]`), un
 * geste horizontal (survol souris ou wheel/trackpad) ne fait RIEN : ni
 * navigation du carrousel, ni preventDefault. Volontaire côté UX : un
 * utilisateur qui regarde la vidéo active ne doit pas la voir changer à
 * cause d'un mouvement horizontal involontaire du trackpad ; il doit
 * déplacer son pointeur hors du média pour parcourir les autres contenus.
 * Vérification faite par événement (e.target.closest(...)), sans aucun
 * état mémorisé : dès que le pointeur quitte cette carte, le comportement
 * normal reprend immédiatement. Ne s'applique PAS au clic-glisser tactile
 * (toucher directement le média pour le faire glisser reste une action
 * volontaire, comme dans n'importe quel carrousel tactile).
 *
 * Isolation du mouvement de page (wheel), CONSERVÉE telle quelle :
 * l'intention horizontale/verticale d'un geste wheel est tranchée dès les
 * premiers deltas significatifs puis verrouillée pour toute la durée de ce
 * geste (y compris sa traîne inertielle) — jamais réévaluée événement par
 * événement, pour qu'aucun fragment isolé au ratio ambigu n'échappe au
 * preventDefault() et ne laisse le navigateur interpréter un geste par
 * ailleurs horizontal comme un rebond/une navigation historique de page.
 * En complément, body.page-universe reçoit overscroll-behavior-x: none en
 * CSS (voir css/pages/universe.css). Ces deux protections ne sont PAS
 * modifiées par la présente reconstruction.
 *
 * Performance : uniquement transform/opacity, jamais left/right/width/
 * height/margin. Aucune lecture de mise en page dans les gestionnaires
 * d'événements ni pendant le geste. Les mises à jour de l'aperçu en direct
 * sont coalescées via un seul requestAnimationFrame, et ce rAF vérifie
 * l'état courant avant d'écrire quoi que ce soit : un callback programmé
 * juste avant un commit ne peut donc jamais s'exécuter après coup et
 * perturber le règlement qui vient de démarrer. Respecte
 * prefers-reduced-motion en désactivant l'animation de règlement (le
 * changement reste instantané plutôt qu'animé, la fonctionnalité elle-même
 * reste disponible).
 *
 * AJOUT — clic/tap/clavier pour amener une carte au premier plan (voir
 * bringToFront() dans initStack) : complète le glissement ci-dessus sans
 * le remplacer, pour les piles où consulter le contenu par simple
 * pression est plus naturel qu'un geste de glissement (ex. carrousels
 * d'images "Communication digitale" sur face-a-face.html, plusieurs cartes
 * par pile). N'affecte jamais les piles à carte unique (vidéos) : la carte
 * y est toujours à depth 0, donc toujours ignorée par la garde
 * `depth <= 0` de bringToFront(). Aucune nouvelle logique de rendu :
 * réutilise render()/armUnlock() déjà existants.
 */
(function () {
  "use strict";

  if (!document.body.classList.contains("page-universe")) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PEEK_STEP_FALLBACK = 30; // px, utilisé seulement si --stack-peek-step est illisible
  var SCALE_STEP = 0.025;
  var OPACITY_STEP = 0.13;
  var DRAG_COMMIT_THRESHOLD = 90; // px — distance à partir de laquelle un geste devient un changement de carte
  var FLICK_VELOCITY_THRESHOLD = 0.5; // px/ms — tactile uniquement (relâchement rapide sous le seuil de distance)
  var SETTLE_DURATION = 460; // ms
  var SETTLE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
  var SETTLE_TRANSITION =
    "transform " + SETTLE_DURATION + "ms " + SETTLE_EASING + ", opacity " + SETTLE_DURATION + "ms ease";
  var UNLOCK_MARGIN = 40; // ms de marge après SETTLE_DURATION avant de considérer le règlement terminé
  var ABANDON_QUIET_MS = 130; // silence au-delà duquel un geste souris/trackpad qui n'a pas franchi le seuil est abandonné (retour élastique)
  var WHEEL_RATIO_MARGIN = 1.1; // petite marge (10%) pour ignorer le bruit diagonal, sans ralentir la détection
  var WHEEL_MIN_DELTA = 0.5; // ignore uniquement le bruit de rendu à zéro, réaction quasi immédiate
  var WHEEL_GESTURE_RESET_MS = 250; // silence au-delà duquel un nouveau geste wheel peut être requalifié horizontal/vertical

  var STATE_IDLE = "idle";
  var STATE_DRAGGING = "dragging";
  var STATE_LOCKED = "locked";

  function initStack(stackEl) {
    var cards = Array.prototype.slice.call(stackEl.querySelectorAll(".universe-project__stack-card"));
    if (cards.length < 2) return;

    // order[depth] = index (dans `cards`) de la carte occupant cette profondeur.
    var order = cards.map(function (_, i) { return i; });

    // État de la machine ci-dessus (IDLE / DRAGGING / LOCKED). C'est la
    // SEULE source de vérité sur "qui a le droit d'écrire transform en ce
    // moment" — chaque gestionnaire d'événement le vérifie avant d'agir.
    var state = STATE_IDLE;
    var unlockTimer = null;

    // Le décalage horizontal entre profondeurs est défini en CSS
    // (--stack-peek-step sur .universe-project__media--stack, hérité par
    // l'élément [data-project-stack]) afin de pouvoir varier selon les
    // points de rupture existants (voir css/pages/universe.css) sans
    // dupliquer de logique de media query ici. Lu uniquement à l'init et au
    // redimensionnement — jamais par frame ni dans un handler de geste.
    var peekStep = readPeekStep();

    function readPeekStep() {
      var raw = getComputedStyle(stackEl).getPropertyValue("--stack-peek-step");
      var val = parseFloat(raw);
      return isNaN(val) ? PEEK_STEP_FALLBACK : val;
    }

    // Fonction pure : profondeur -> état visuel cible. Ne dépend jamais de
    // l'historique du geste ni d'une position précédente.
    function depthLayout(depth) {
      return {
        tx: depth * peekStep,
        scale: Math.max(1 - depth * SCALE_STEP, 0.85),
        opacity: Math.max(1 - depth * OPACITY_STEP, 0.4)
      };
    }

    function transformFor(layout) {
      return "translate3d(" + layout.tx + "px, 0, 0) scale(" + layout.scale.toFixed(3) + ")";
    }

    // SEULE fonction qui écrit l'état de repos des cartes. N'est appelée
    // qu'à l'initialisation/resize (withAnimation=false) ou au moment où
    // l'on bascule vers LOCKED (withAnimation=true) — jamais pendant
    // DRAGGING. Ces deux cas ne peuvent pas se chevaucher : la machine à
    // états l'empêche structurellement.
    function render(withAnimation) {
      var animate = withAnimation && !reduceMotion;

      for (var depth = 0; depth < order.length; depth++) {
        var idx = order[depth];
        var card = cards[idx];
        var target = depthLayout(depth);
        var targetTransform = transformFor(target);
        var targetOpacity = target.opacity.toFixed(2);

        card.style.zIndex = String(cards.length - depth);
        card.classList.toggle("is-active", depth === 0);
        card.style.transition = animate ? SETTLE_TRANSITION : "none";
        card.style.transform = targetTransform;
        card.style.opacity = targetOpacity;
      }
    }

    // Bascule vers LOCKED : personne d'autre ne touche transform tant que
    // ce verrou est actif (voir les gardes `state !== ...` plus bas). Le
    // filet de sécurité (setTimeout) réaffirme l'état exact et déverrouille
    // après la durée de règlement, indépendamment du rendu visuel réel de
    // la transition CSS — garantit qu'aucune carte ne peut rester figée en
    // LOCKED indéfiniment.
    function commitAndLock(direction) {
      if (direction < 0) {
        order.push(order.shift());
      } else {
        order.unshift(order.pop());
      }
      state = STATE_LOCKED;
      render(true);
      armUnlock();
    }

    // Retour élastique : l'ordre ne change pas, seule la position de repos
    // (identique à l'actuelle) est réaffirmée — utile si l'aperçu en direct
    // avait déplacé la carte active sans franchir le seuil.
    function springBackAndLock() {
      state = STATE_LOCKED;
      render(true);
      armUnlock();
    }

    function armUnlock() {
      if (unlockTimer) window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(function () {
        unlockTimer = null;
        render(false); // snap final forcé, indépendant du déroulement visuel
        state = STATE_IDLE;
      }, SETTLE_DURATION + UNLOCK_MARGIN);
    }

    render(false);

    window.addEventListener(
      "resize",
      function () {
        peekStep = readPeekStep();
        if (state !== STATE_LOCKED) render(false);
      },
      { passive: true }
    );

    // ---- Clic/tap/clavier sur une carte non active : l'amène au premier
    // plan (ajout — piles "Communication digitale" de face-a-face.html,
    // qui doivent désormais être réellement consultables, pas seulement
    // glissables). Complète le glissement existant, ne le remplace pas :
    // aucune des deux interactions n'est retirée. Rétrocompatible avec les
    // piles vidéo (une seule carte chacune, toujours à depth 0 → la garde
    // `depth <= 0` ci-dessous les rend inertes, comportement inchangé pour
    // elles) et avec toute autre pile future à plusieurs cartes.
    // bringToFront() réutilise render()/armUnlock() déjà existants : aucune
    // logique de positionnement dupliquée, seul le calcul du nouvel `order`
    // diffère de commitAndLock() (déplacement direct vers l'avant, plutôt
    // qu'une rotation d'un seul cran).
    function bringToFront(idx) {
      if (state !== STATE_IDLE) return; // un geste ou un règlement est déjà en cours : ignoré
      var depth = order.indexOf(idx);
      if (depth <= 0) return; // déjà au premier plan : rien à faire
      order.splice(depth, 1);
      order.unshift(idx);
      state = STATE_LOCKED;
      render(true);
      armUnlock();
    }

    cards.forEach(function (card, idx) {
      card.addEventListener("click", function () {
        bringToFront(idx);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          bringToFront(idx);
        }
      });
    });

    // ---- Aperçu en direct pendant DRAGGING uniquement -----------------------
    // Volontairement instantané (transition: none) : ce n'est qu'un aperçu,
    // jamais un état "final" — seul render() écrit l'état final. Ignoré
    // sans effet si l'état a changé entre-temps (rAF coalescé : un callback
    // programmé juste avant un commit ne doit jamais s'exécuter après coup).
    function applyDragPreview(dx) {
      if (state !== STATE_DRAGGING) return;

      var frontIdx = order[0];
      var fc = cards[frontIdx];
      fc.style.transition = "none";
      fc.style.transform = "translate3d(" + dx + "px, 0, 0) scale(1)";

      if (order.length > 1) {
        var nextIdx = order[1];
        var nc = cards[nextIdx];
        // La carte suivante termine sa course exactement au moment où le
        // seuil de commit est atteint : plus de "distance de parcours"
        // séparée du seuil de validation, donc plus d'écart résiduel à
        // rattraper par l'animation de règlement.
        var progress = Math.min(Math.abs(dx) / DRAG_COMMIT_THRESHOLD, 1);
        var layout = { tx: peekStep * (1 - progress), scale: 1 - SCALE_STEP * (1 - progress) };
        nc.style.transition = "none";
        nc.style.transform = transformFor(layout);
        nc.style.opacity = (1 - OPACITY_STEP * (1 - progress)).toFixed(2);
      }
    }

    // ---- Glissement tactile (doigt) — scopé à la pile, inchangé ------------
    var intentResolved = false;
    var intentRejected = false;
    var pointerId = null;
    var startX = 0;
    var startY = 0;
    var lastX = 0;
    var lastT = 0;
    var velocity = 0;
    var rafPending = false;
    var pendingDx = 0;

    function onPointerDown(e) {
      if (state === STATE_LOCKED) return; // un règlement est en cours : ce nouveau contact est ignoré
      if (e.pointerType === "mouse" && e.button !== 0) return;
      intentResolved = false;
      intentRejected = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastT = performance.now();
      velocity = 0;
    }

    function onPointerMove(e) {
      if (state === STATE_LOCKED || intentRejected || e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;

      if (!intentResolved) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.2) {
          // Geste principalement vertical : on laisse le scroll natif de la
          // page faire son travail, sans jamais y toucher.
          intentRejected = true;
          return;
        }
        intentResolved = true;
        state = STATE_DRAGGING;
        try {
          stackEl.setPointerCapture(pointerId);
        } catch (err) {
          /* ignore */
        }
      }

      e.preventDefault();

      var now = performance.now();
      var dt = Math.max(now - lastT, 1);
      velocity = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastT = now;

      pendingDx = dx;
      if (!rafPending) {
        rafPending = true;
        window.requestAnimationFrame(function () {
          rafPending = false;
          applyDragPreview(pendingDx);
        });
      }

      if (Math.abs(dx) >= DRAG_COMMIT_THRESHOLD) {
        commitAndLock(dx < 0 ? -1 : 1);
      }
    }

    function onPointerUp(e) {
      if (state !== STATE_DRAGGING || e.pointerId !== pointerId) return;
      if (!intentResolved) return;

      var dx = e.clientX - startX;
      if (dx < 0 && velocity < -FLICK_VELOCITY_THRESHOLD) {
        commitAndLock(-1);
      } else if (dx > 0 && velocity > FLICK_VELOCITY_THRESHOLD) {
        commitAndLock(1);
      } else {
        springBackAndLock();
      }
    }

    stackEl.addEventListener("pointerdown", onPointerDown, { passive: true });
    stackEl.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

    // ---- Survol souris (sans clic) + trackpad/molette horizontale ---------
    // Zone élargie : tout le bloc du projet (média + texte), pas seulement
    // la pile — voir le commentaire d'en-tête. La souris ne fait jamais
    // défiler la page par simple déplacement du curseur (contrairement au
    // doigt), donc aucune détection d'intention verticale n'est nécessaire
    // ici pour le survol ; seul le composant horizontal est lu. Pour la
    // molette/trackpad, la comparaison |deltaX| vs |deltaY| protège le
    // scroll vertical (voir onWheel).
    var zoneEl = (stackEl.closest && stackEl.closest(".universe-project")) || stackEl;

    // Zone protégée : le média actuellement actif (quel qu'il soit — la
    // classe .is-active suit `order[0]`, jamais codé en dur pour un média
    // en particulier). Tant que le pointeur s'y trouve, un geste horizontal
    // ne doit ni faire glisser la pile ni bloquer le scroll vertical — on
    // se contente de ne rien faire du tout pour cet événement précis,
    // aucun preventDefault, aucun changement d'état. Vérification purement
    // via e.target.closest(), sans lecture de mise en page.
    function isOverActiveCard(e) {
      var target = e.target;
      return !!(target && target.closest && target.closest(".universe-project__stack-card.is-active"));
    }

    var hoverOffset = 0;
    var hoverLastX = null;
    var hoverLastT = 0;
    var hoverRafPending = false;
    var abandonTimer = null;

    function scheduleAbandonCheck() {
      if (abandonTimer) window.clearTimeout(abandonTimer);
      abandonTimer = window.setTimeout(function () {
        abandonTimer = null;
        if (state === STATE_DRAGGING) {
          hoverOffset = 0;
          springBackAndLock();
        }
      }, ABANDON_QUIET_MS);
    }

    // Décision INSTANTANÉE dès le franchissement du seuil — plus d'attente
    // d'un silence pour "deviner" la fin du geste. C'est ce changement qui
    // évite qu'une traîne inertielle de trackpad laisse l'aperçu en direct
    // dériver longtemps avant qu'une vraie transition de règlement démarre :
    // dès que le seuil est franchi, le commit et son verrou sont immédiats.
    function nudgeHover(dx, dt) {
      if (state === STATE_LOCKED) return; // un règlement est en cours : ce delta est ignoré, pas mis en file
      if (state === STATE_IDLE) {
        state = STATE_DRAGGING;
        hoverOffset = 0;
      }

      hoverOffset += dx;

      if (!hoverRafPending) {
        hoverRafPending = true;
        window.requestAnimationFrame(function () {
          hoverRafPending = false;
          applyDragPreview(hoverOffset);
        });
      }

      if (Math.abs(hoverOffset) >= DRAG_COMMIT_THRESHOLD) {
        var direction = hoverOffset < 0 ? -1 : 1;
        hoverOffset = 0;
        commitAndLock(direction);
        return;
      }

      scheduleAbandonCheck();
    }

    function onHoverMove(e) {
      if (e.pointerType !== "mouse" || isOverActiveCard(e)) {
        hoverLastX = null;
        return;
      }
      var now = performance.now();
      if (hoverLastX === null) {
        hoverLastX = e.clientX;
        hoverLastT = now;
        return;
      }
      var dx = e.clientX - hoverLastX;
      var dt = Math.max(now - hoverLastT, 1);
      hoverLastX = e.clientX;
      hoverLastT = now;
      if (dx === 0) return;
      nudgeHover(dx, dt);
    }

    function onHoverLeave(e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      hoverLastX = null;
      if (abandonTimer) {
        window.clearTimeout(abandonTimer);
        abandonTimer = null;
      }
      if (state === STATE_DRAGGING) {
        hoverOffset = 0;
        springBackAndLock();
      }
    }

    // Intention verrouillée pour la DURÉE COMPLÈTE d'un geste wheel continu
    // (y compris sa traîne inertielle), plutôt que réévaluée événement par
    // événement — CONSERVÉ tel quel (voir commentaire d'en-tête) : c'est ce
    // qui empêche un fragment de geste d'échapper au preventDefault et
    // d'être interprété par le navigateur comme une navigation de page.
    var wheelIntent = "none"; // "none" | "horizontal" | "vertical"
    var wheelResetTimer = null;

    function armWheelReset() {
      if (wheelResetTimer) window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(function () {
        wheelIntent = "none";
      }, WHEEL_GESTURE_RESET_MS);
    }

    function onWheel(e) {
      if (isOverActiveCard(e)) return; // zone protégée : ni preventDefault, ni navigation du carrousel

      if (wheelIntent === "vertical") {
        armWheelReset();
        return;
      }

      var adx = Math.abs(e.deltaX);
      var ady = Math.abs(e.deltaY);

      if (wheelIntent === "none") {
        if (adx < WHEEL_MIN_DELTA && ady < WHEEL_MIN_DELTA) return; // rien de significatif encore
        if (adx > ady * WHEEL_RATIO_MARGIN) {
          wheelIntent = "horizontal";
        } else {
          wheelIntent = "vertical";
          armWheelReset();
          return;
        }
      }

      // wheelIntent === "horizontal" : assumé pour toute la durée du geste,
      // preventDefault appliqué systématiquement — jamais de façon
      // intermittente — pour qu'aucun fragment de ce geste ne puisse
      // atteindre le comportement natif du navigateur.
      armWheelReset();
      e.preventDefault();
      nudgeHover(-e.deltaX, 16);
    }

    zoneEl.addEventListener("pointermove", onHoverMove, { passive: true });
    zoneEl.addEventListener("pointerleave", onHoverLeave, { passive: true });
    zoneEl.addEventListener("wheel", onWheel, { passive: false });
  }

  function init() {
    var stacks = document.querySelectorAll("[data-project-stack]");
    for (var i = 0; i < stacks.length; i++) {
      try {
        initStack(stacks[i]);
      } catch (err) {
        // Une pile qui échoue à s'initialiser ne doit jamais affecter les
        // autres piles ni le reste de la page.
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
