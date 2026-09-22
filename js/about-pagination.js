/**
 * VAGABON — js/about-pagination.js
 * ============================================================================
 * Pagination plein écran de qui-suis-je.html (.who-pagination) — 5 sections
 * réelles de la page (Hero, #profil, #valeurs, #vision, #methode) transformées
 * en "pages" empilées au scroll. Ce fichier n'est chargé que sur cette page et
 * ne cible strictement que .who-pagination — aucune interaction avec le reste
 * du DOM ni avec les autres scripts déjà en place (js/animations.js,
 * js/universe.js, js/qui-suis-je-slideshow.js).
 *
 * DÉGRADATION — sans ce script, sans GSAP/ScrollTrigger, ou sous
 * prefers-reduced-motion : aucune classe .who-pagination--active n'est jamais
 * posée, donc css/pages/qui-suis-je.css n'applique ni position:absolute ni
 * transform aux .who-page — les 5 sections restent en flux vertical normal,
 * identique au rendu de cette page avant cette fonctionnalité. Seule la
 * pagination (01 à 05) est rendue visible et cliquable dans tous les cas dès
 * que ce script s'exécute (voir initFallbackNav ci-dessous), y compris sans
 * GSAP.
 *
 * MODE ENRICHI — uniquement si GSAP + ScrollTrigger sont chargés ET
 * prefers-reduced-motion ne s'applique pas : gsap.matchMedia() scinde 3
 * contextes (desktop >=1201px pointeur fin, tablette 901-1200px, mobile
 * <901px), chacun avec sa propre amplitude de rotation/translation. Chaque
 * contexte crée SON PROPRE ScrollTrigger (pin + scrub), automatiquement
 * détruit par matchMedia à la sortie du contexte (résolution, ou passage en
 * reduced-motion en cours de session) — jamais ScrollTrigger.killAll(),
 * aucun effet créé en dehors de .who-pagination.
 *
 * PROGRESSION — 5 pages, 4 transitions (voir demande explicite du client).
 * Le mouvement est porté par UNE SEULE timeline GSAP dont la position est
 * directement pilotée par le scrub du ScrollTrigger (scrub: chaque tween
 * occupe un segment de temps égal de la timeline, aucun activateIndex() ne
 * lance de tween à durée indépendante qui pourrait lutter contre un scroll
 * rapide vers le haut) : la page 1 est pleinement visible à progress=0, la
 * page 5 est pleinement visible à progress=1, avant la libération du pin.
 * ============================================================================
 */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var root = document.querySelector(".who-pagination");
    if (!root) return;

    var viewport = root.querySelector("[data-pagination-viewport]");
    var nav = root.querySelector("[data-pagination-nav]");
    var pages = Array.prototype.slice.call(root.querySelectorAll(".who-page"));
    var dots = nav ? Array.prototype.slice.call(nav.querySelectorAll("[data-page-target]")) : [];

    if (!viewport || pages.length === 0) return;

    // Ordonne les pages selon data-page-index plutôt que de supposer l'ordre
    // du DOM (robuste si le balisage venait à être réorganisé plus tard).
    pages.sort(function (a, b) {
      return Number(a.getAttribute("data-page-index")) - Number(b.getAttribute("data-page-index"));
    });

    var NUM_PAGES = pages.length; // 5

    var reducedMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    var currentIndex = 0;
    var activeNavigate = null; // function(index) — réassignée selon le mode actif

    /* ---------------------------------------------------------------- */
    /* Pagination — commun aux deux modes (repli et enrichi). Un seul     */
    /* écouteur de clic par bouton, jamais dupliqué : le comportement      */
    /* réel est délégué à activeNavigate(), réassignée selon le contexte.  */
    /* ---------------------------------------------------------------- */
    function setCurrentIndex(index) {
      if (index === currentIndex) return;
      currentIndex = index;
      dots.forEach(function (dot, i) {
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        if (activeNavigate) activeNavigate(i);
      });
    });

    // Rendue visible et cliquable dès que ce script s'exécute, que GSAP
    // charge ou non, que prefers-reduced-motion s'applique ou non — seule
    // la mécanique de pin/rotation dépend du mode, jamais la visibilité de
    // la pagination elle-même (demande explicite : "ne masque pas la
    // pagination").
    root.classList.add("who-pagination--nav-visible");

    var fallbackObserver = null;

    /* ---------------------------------------------------------------- */
    /* Mode repli — reduced-motion, GSAP/ScrollTrigger indisponibles, ou   */
    /* sortie d'un contexte enrichi (resize/changement de préférence en    */
    /* cours de session). Aucune mise en page spécifique n'est appliquée   */
    /* (voir CSS, état par défaut) : les 5 sections restent dans le flux   */
    /* normal. Seule la pagination est enrichie : clic = scrollIntoView    */
    /* natif, synchronisation de aria-current via un IntersectionObserver  */
    /* dédié, indépendant de tout autre observateur déjà présent sur la    */
    /* page (js/animations.js, js/universe.js). Idempotent : peut être     */
    /* appelée plusieurs fois sans dupliquer l'observateur.                */
    /* ---------------------------------------------------------------- */
    function initFallbackNav() {
      activeNavigate = function (i) {
        var target = pages[i];
        var reduced = reducedMotionMq.matches;
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      };

      if (fallbackObserver || !("IntersectionObserver" in window)) return;

      try {
        fallbackObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                var idx = pages.indexOf(entry.target);
                if (idx >= 0) setCurrentIndex(idx);
              }
            });
          },
          { threshold: 0.5 }
        );
        pages.forEach(function (page) {
          fallbackObserver.observe(page);
        });
      } catch (e) {
        // Dégradation silencieuse : la pagination reste cliquable, seule la
        // synchronisation automatique de aria-current est perdue.
        fallbackObserver = null;
      }
    }

    var gsap = window.gsap || null;
    var ScrollTrigger = window.ScrollTrigger || null;

    /* ---------------------------------------------------------------- */
    /* Mode enrichi — pin + scrub + rotation depuis le bas gauche.         */
    /* ---------------------------------------------------------------- */
    function initEnhanced() {
      gsap.registerPlugin(ScrollTrigger);

      var activeContexts = 0;

      function setActive(on) {
        activeContexts += on ? 1 : -1;
        if (activeContexts < 0) activeContexts = 0;
        root.classList.toggle("who-pagination--active", activeContexts > 0);
      }

      // Pause de lecture "statique" pour une page qui ne déborde pas (rien à
      // faire défiler) — courte zone neutre entre la fin de lecture d'une
      // page et le début de l'entrée de la suivante.
      var STATIC_READ_RATIO = 0.35; // x window.innerHeight
      var GAP_RATIO = 0.08; // x window.innerHeight

      var mm = gsap.matchMedia();

      // 3 contextes desktop / tablette / mobile — rotation validée par le
      // client ("6 à 8 degrés comme point de départ" / "4 à 5" / "2 à 4").
      // xOffset/yOffset : position hors-champ RÉELLEMENT suffisante (plus
      // une page entière vers le bas, décalée vers la gauche) — les
      // anciennes valeurs (-14/20 etc.) ne sortaient pas la page du cadre,
      // d'où le défaut "page déjà à moitié visible" signalé par le client.
      // entranceRatio : durée de la seule animation d'entrée (indépendante
      // de la lecture désormais, voir build() ci-dessous), en multiple de
      // window.innerHeight.
      var CONTEXTS = [
        {
          query: "(min-width: 1201px)",
          rotation: 7,
          xOffset: -30,
          yOffset: 115,
          entranceRatio: 0.45
        },
        {
          query: "(min-width: 901px) and (max-width: 1200px)",
          rotation: 4.5,
          xOffset: -26,
          yOffset: 108,
          entranceRatio: 0.4
        },
        {
          query: "(max-width: 900px)",
          rotation: 3,
          xOffset: -22,
          yOffset: 102,
          entranceRatio: 0.35
        }
      ];

      CONTEXTS.forEach(function (ctx) {
        mm.add(ctx.query + " and (prefers-reduced-motion: no-preference)", function () {
          setActive(true);

          var tl = null;
          var st = null;
          var settleTime = [0]; // temps de timeline (px) où chaque page devient "posée" ; settleTime[0]=0
          var totalDuration = 0;
          var resizeTimer = null;

          // Petite marge de sécurité supplémentaire (au-delà du padding
          // CSS déjà header-safe, voir qui-suis-je.css) : garantit que la
          // dernière ligne ne touche jamais littéralement le bord bas du
          // viewport, même en cas d'écart d'arrondi entre navigateurs.
          var EXTRA_SAFETY = 16;

          // Mesure, pour chaque page, la hauteur réelle de son contenu
          // (.who-page__content-track, ou la page elle-même si le wrapper
          // est absent) contre la hauteur RÉELLEMENT disponible dans le
          // viewport : window.innerHeight moins le padding-top/bottom
          // effectif de la page (lu via getComputedStyle, pas une valeur
          // devinée) — ce padding contient déjà la hauteur réelle du
          // header (--nav-height) côté haut, voir la règle
          // .who-pagination--active .who-section.who-page dans
          // qui-suis-je.css. Avant cette correction, "available" valait
          // window.innerHeight brut, ignorant ce padding : le débordement
          // réel était donc sous-estimé (d'où la transition qui démarrait
          // avant la fin réelle du texte). scrollHeight est indépendant de
          // tout transform (rotation, translation, y du track) : aucune
          // neutralisation nécessaire.
          function measure() {
            return pages.map(function (page) {
              var track = page.querySelector(".who-page__content-track") || page;
              var trackHeight = track.scrollHeight;
              var styles = window.getComputedStyle(page);
              var paddingTop = parseFloat(styles.paddingTop) || 0;
              var paddingBottom = parseFloat(styles.paddingBottom) || 0;
              var available = window.innerHeight - paddingTop - paddingBottom - EXTRA_SAFETY;
              var overflow = Math.max(0, Math.round(trackHeight - available));
              return { track: track, overflow: overflow };
            });
          }

          // (Re)construit entièrement la timeline + le ScrollTrigger à
          // partir d'une mesure fraîche du contenu réel. Appelée au premier
          // rendu, puis après chargement des images, et au resize (voir
          // plus bas) : le débordement de chaque page peut changer avec la
          // largeur disponible (retour à la ligne du texte).
          function build() {
            var measurements = measure();

            pages.forEach(function (page, idx) {
              page.classList.toggle("who-page--overflow", measurements[idx].overflow > 0);
            });

            if (st) {
              st.kill();
              st = null;
            }
            if (tl) {
              tl.kill();
              tl = null;
            }

            // État de départ : page 0 posée à plat, visible. Pages 1 à N
            // hors-champ (réellement, voir ctx.xOffset/yOffset) ET
            // explicitement invisibles (visibility:hidden) tant que LEUR
            // PROPRE transition n'a pas commencé — z-index de base identique
            // à la page 0, jamais assigné d'avance de façon croissante.
            gsap.set(pages[0], { xPercent: 0, yPercent: 0, rotation: 0, zIndex: 1, visibility: "visible" });
            for (var i = 1; i < pages.length; i++) {
              gsap.set(pages[i], {
                xPercent: ctx.xOffset,
                yPercent: ctx.yOffset,
                rotation: ctx.rotation,
                transformOrigin: "0% 100%",
                zIndex: 1,
                visibility: "hidden"
              });
            }
            pages.forEach(function (page, idx) {
              gsap.set(measurements[idx].track, { y: 0 });
            });

            tl = gsap.timeline({ defaults: { ease: "none" } });

            var STATIC_READ = Math.round(window.innerHeight * STATIC_READ_RATIO);
            var GAP = Math.round(window.innerHeight * GAP_RATIO);
            var ENTRANCE = Math.round(window.innerHeight * ctx.entranceRatio);

            settleTime = [0];
            var cursor = 0;

            for (var p = 0; p < pages.length; p++) {
              var m = measurements[p];

              // Phase de lecture : si le contenu déborde, le conteneur
              // interne remonte de exactement la distance de débordement,
              // en mappage 1:1 avec le scroll (un geste de scroll naturel,
              // continu, sans scrollbar indépendante). Sinon, simple pause
              // statique — la page suivante reste hors-champ/masquée dans
              // les deux cas puisque rien ne la concerne encore.
              if (m.overflow > 0) {
                tl.to(m.track, { y: -m.overflow, duration: m.overflow }, cursor);
                cursor += m.overflow;
              } else {
                tl.to({}, { duration: STATIC_READ }, cursor);
                cursor += STATIC_READ;
              }

              if (p < pages.length - 1) {
                // Courte zone neutre avant que l'entrée suivante ne
                // commence — la page suivante reste hors-champ pendant
                // toute cette durée, elle aussi.
                cursor += GAP;

                var next = p + 1;
                var incoming = pages[next];
                var visual = incoming.querySelector(
                  ".who-hero__portrait, .who-section__visual, .who-section__slideshow"
                );

                // Bascule instantanée, exactement au début de CETTE
                // transition (jamais avant) : la page devient visible et
                // passe au-dessus de tout ce qui est déjà empilé. Un .set()
                // positionné à un instant précis de la timeline se
                // réapplique correctement dans les deux sens de scrub.
                tl.set(incoming, { visibility: "visible", zIndex: next + 1 }, cursor);
                tl.to(
                  incoming,
                  { xPercent: 0, yPercent: 0, rotation: 0, duration: ENTRANCE },
                  cursor
                );
                if (visual) {
                  tl.fromTo(
                    visual,
                    { scale: 1.045 },
                    { scale: 1, duration: ENTRANCE, ease: "power1.out" },
                    cursor
                  );
                }

                cursor += ENTRANCE;
                settleTime.push(cursor); // la page `next` est posée à cet instant précis
              }
            }

            totalDuration = cursor;
            var distance = Math.max(1, Math.round(totalDuration));

            st = ScrollTrigger.create({
              trigger: viewport,
              start: "top top",
              end: "+=" + distance,
              pin: true,
              pinSpacing: true,
              scrub: 0.5,
              animation: tl,
              onUpdate: function (self) {
                // Le numéro actif ne change qu'une fois une page
                // ENTIÈREMENT posée (settleTime[k]), jamais pendant sa
                // lecture ni au milieu de son entrée — demande explicite du
                // client.
                var tt = self.progress * totalDuration;
                var idx = 0;
                for (var k = settleTime.length - 1; k >= 0; k--) {
                  if (tt >= settleTime[k] - 0.5) {
                    idx = k;
                    break;
                  }
                }
                setCurrentIndex(idx);
              }
            });

            activeNavigate = function (i) {
              var targetProgress = settleTime[i] / totalDuration;
              var targetScroll = st.start + targetProgress * (st.end - st.start);
              st.scroll(targetScroll);
            };
          }

          build();

          // Recalcule au chargement des images (les dimensions intrinsèques
          // peuvent légèrement affiner la hauteur réelle du contenu) et au
          // resize (débounced) — jamais pendant un drag continu de la
          // fenêtre, uniquement une fois celui-ci stabilisé.
          var onLoad = function () {
            build();
          };
          window.addEventListener("load", onLoad);

          var onResize = function () {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(build, 200);
          };
          window.addEventListener("resize", onResize);

          // Nettoyage ciblé : gsap.matchMedia() appelle automatiquement
          // cette fonction de retour lorsque CE contexte précis cesse de
          // correspondre (résolution, ou passage en reduced-motion) — jamais
          // ScrollTrigger.killAll(), jamais d'effet sur d'autres instances
          // créées ailleurs sur la page. Rebascule proprement sur le mode
          // repli plutôt que de laisser les pages dans un état transformé
          // orphelin.
          return function () {
            window.removeEventListener("load", onLoad);
            window.removeEventListener("resize", onResize);
            if (resizeTimer) clearTimeout(resizeTimer);
            if (st) st.kill();
            if (tl) tl.kill();
            gsap.set(pages, { clearProps: "transform,zIndex,visibility" });
            pages.forEach(function (page) {
              var track = page.querySelector(".who-page__content-track");
              if (track) gsap.set(track, { clearProps: "transform" });
              page.classList.remove("who-page--overflow");
            });
            setActive(false);
            initFallbackNav();
          };
        });
      });
    }

    if (gsap && ScrollTrigger && !reducedMotionMq.matches) {
      try {
        initEnhanced();
      } catch (e) {
        // Sécurité : si GSAP/ScrollTrigger échouent en cours de route, le
        // mode repli (déjà branché ci-dessus pour la visibilité) prend le
        // relais intégralement — aucun contenu bloqué, aucune section
        // inaccessible.
        initFallbackNav();
      }
    } else {
      initFallbackNav();
    }
  });
})();
