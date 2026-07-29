/**
 * VAGABON — js/face-a-face-video-sound.js
 * Contrôles (son, et lecture/pause quand ce bouton existe) dédiés aux
 * vidéos de la page Face à Face (face-a-face.html UNIQUEMENT — scopé via
 * [data-sound-toggle] / [data-play-toggle], des attributs qui n'existent
 * nulle part ailleurs dans le projet). Fichier isolé, sans dépendance avec
 * js/universe-media-stack.js : ce dernier gère déjà correctement le cas
 * d'une pile réduite à une seule carte (il s'arrête dès l'initialisation,
 * voir son propre commentaire d'en-tête), donc aucune modification n'y a
 * été nécessaire pour ce chantier.
 *
 * Architecture : initVideoControls() s'exécute une fois par carte vidéo
 * (.universe-project__stack-card) plutôt qu'une fois par bouton — chaque
 * carte peut porter un bouton son, un bouton lecture/pause, les deux, ou
 * aucun. Sur cette page : la vidéo Jean-Marc porte les DEUX boutons, la
 * vidéo Zohir porte uniquement le bouton son (comportement strictement
 * inchangé pour elle : mêmes attributs, même logique, seule différence
 * étant l'absence de bouton lecture/pause dans son HTML).
 *
 * Comportement :
 * - autoplay / muted / loop / playsinline restent des attributs HTML
 *   statiques, inchangés : aucun contournement des restrictions
 *   d'autoplay des navigateurs, comportement natif conservé partout
 *   (Chrome, Safari, Firefox, mobile).
 * - Le bouton son ne touche JAMAIS à currentTime ni à .load() : basculer
 *   video.muted ne redémarre ni n'interrompt la lecture en cours (c'est le
 *   comportement natif de l'élément <video>).
 * - Le bouton lecture/pause utilise uniquement video.play() / video.pause() :
 *   aucune remise à zéro de currentTime, une reprise après pause repart
 *   exactement où la lecture s'était arrêtée.
 * - Pause volontaire vs pause automatique : un indicateur interne
 *   (userPaused, propre à chaque carte, jamais partagé entre vidéos) note
 *   qu'une pause a été demandée explicitement via le bouton. L'
 *   IntersectionObserver qui gère la sortie de viewport consulte cet
 *   indicateur avant de relancer la lecture au retour dans le cadre : si
 *   l'utilisateur a mis en pause volontairement, la vidéo reste en pause
 *   même en revenant dans le viewport, jusqu'à un nouveau clic sur le
 *   bouton. Sortir du viewport, à l'inverse, ne modifie jamais cet
 *   indicateur (ce n'est pas une pause voulue par l'utilisateur).
 * - Les libellés accessibles (aria-pressed / aria-label) reflètent en
 *   permanence l'état réel de la vidéo, et restent correctement traduits
 *   même après un changement de langue : au lieu de gérer sa propre
 *   logique de traduction, ce script écrit la clé i18n correspondant au
 *   NOUVEL état dans l'attribut data-i18n-attr déjà utilisé partout
 *   ailleurs sur le site (voir js/language.js, non modifié) — un futur
 *   changement de langue via le sélecteur FR/EN du header retraduira donc
 *   ces boutons automatiquement, sans code supplémentaire ici.
 */
(function () {
  "use strict";

  function currentLang() {
    return document.documentElement.getAttribute("lang") === "en" ? "en" : "fr";
  }

  function translate(key, fallback) {
    var dict = window.VAGABON_TRANSLATIONS && window.VAGABON_TRANSLATIONS[currentLang()];
    return (dict && dict[key]) || fallback;
  }

  function initVideoControls(card) {
    var video = card.querySelector("video[data-project-video]");
    if (!video) return;

    var soundButton = card.querySelector("[data-sound-toggle]");
    var playButton = card.querySelector("[data-play-toggle]");

    /* true uniquement après un clic explicite sur le bouton pause ; remis à
       false par un clic sur le bouton lecture. Jamais modifié par la sortie
       de viewport (pause automatique) ni par son retour. */
    var userPaused = false;

    if (soundButton) {
      (function () {
        function syncSoundState() {
          var isOn = !video.muted;
          soundButton.setAttribute("aria-pressed", isOn ? "true" : "false");
          var key = isOn ? "faf.video.sound_off" : "faf.video.sound_on";
          var fallback = isOn ? "Couper le son" : "Activer le son";
          soundButton.setAttribute("data-i18n-attr", "aria-label:" + key);
          soundButton.setAttribute("aria-label", translate(key, fallback));
        }

        soundButton.addEventListener("click", function () {
          video.muted = !video.muted;
          if (!video.muted) {
            video.volume = 1;
          }
          syncSoundState();
        });

        syncSoundState();
      })();
    }

    if (playButton) {
      (function () {
        function syncPlayState() {
          var isPlaying = !video.paused;
          playButton.setAttribute("aria-pressed", isPlaying ? "true" : "false");
          var key = isPlaying ? "faf.video.pause" : "faf.video.play";
          var fallback = isPlaying ? "Mettre en pause" : "Reprendre la lecture";
          playButton.setAttribute("data-i18n-attr", "aria-label:" + key);
          playButton.setAttribute("aria-label", translate(key, fallback));
        }

        playButton.addEventListener("click", function () {
          if (video.paused) {
            userPaused = false;
            video.play().catch(function () {
              /* Reprise bloquée par le navigateur (cas rare) : ignorée
                 silencieusement, syncPlayState() (déclenché par l'évènement
                 "pause"/"play" natif ci-dessous) reflétera l'état réel. */
            });
          } else {
            userPaused = true;
            video.pause();
          }
        });

        /* Les évènements natifs "play"/"pause" (plutôt qu'un appel direct
           dans le handler de clic) garantissent que l'icône reflète
           TOUJOURS l'état réel de la vidéo, y compris si play()/pause()
           est déclenché ailleurs (IntersectionObserver ci-dessous). */
        video.addEventListener("play", syncPlayState);
        video.addEventListener("pause", syncPlayState);
        syncPlayState();
      })();
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              if (!userPaused) {
                video.play().catch(function () {
                  /* Reprise bloquée par le navigateur (cas rare) : ignorée
                     silencieusement, la vidéo reste simplement en pause. */
                });
              }
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0.25 }
      );
      observer.observe(video);
    }
  }

  function init() {
    var cards = document.querySelectorAll(".universe-project__stack-card");
    for (var i = 0; i < cards.length; i++) {
      try {
        initVideoControls(cards[i]);
      } catch (err) {
        /* Une carte qui échoue à s'initialiser ne doit jamais affecter les
           autres cartes ni le reste de la page. */
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
