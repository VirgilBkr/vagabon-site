/**
 * VAGABON — js/universe-hero-distortion.js
 * Déformation locale (réfraction glacée) de l'image de fond du Hero au
 * passage du curseur — page portfolio (universe.html) UNIQUEMENT. Fichier
 * entièrement indépendant de js/universe-cursor.js (pas de couplage, pas
 * de variable partagée) : il ne modifie ni ne lit rien dans ce dernier, et
 * la landing page (index.html) ne le charge pas.
 *
 * Principe : une première tentative avec `backdrop-filter` + un filtre SVG
 * feDisplacementMap ne produisait aucune déformation visible (support
 * réel insuffisant de cette combinaison dans les navigateurs ciblés,
 * malgré CSS.supports() === true — voir l'échange précédent). Ce fichier
 * la remplace par un petit rendu WebGL natif : un unique quad texturé
 * (l'image de fond du Hero, chargée une seule fois) couvre exactement la
 * même zone que le fond CSS de #universe-intro, avec un fragment shader
 * qui déplace légèrement les coordonnées de texture autour de la position
 * de la souris (distance + falloff radial), avant d'échantillonner la
 * texture — donc une vraie déformation optique du contenu, pas un calque
 * ajouté par-dessus. Hors de la zone d'effet, le rendu est pixel-identique
 * à l'image CSS restée en dessous.
 *
 * Désactivé entièrement (aucun canvas créé, l'image de fond CSS reste seule
 * visible, sans aucune différence) si : prefers-reduced-motion: reduce,
 * pointeur tactile/grossier, WebGL indisponible, l'image de fond ne peut
 * pas être déterminée ou ne charge pas.
 *
 * Performance : un seul appel de dessin par frame (un quad, un shader très
 * simple — coût GPU négligeable), un pool d'aucune particule, aucune
 * lecture de layout par frame (getBoundingClientRect n'est appelé qu'une
 * fois à l'initialisation et sur "resize", jamais dans la boucle), un
 * IntersectionObserver pour suspendre le rendu quand le Hero n'est pas à
 * l'écran, et un mousemove/scroll : seul mousemove est écouté (passif), et
 * la position dans le référentiel de la section utilise window.scrollY
 * (propriété déjà maintenue par le navigateur, aucun coût de lecture de
 * mise en page) plutôt qu'un listener de scroll dédié.
 */
(function () {
  "use strict";

  if (!document.body.classList.contains("page-universe")) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (reduceMotion || coarsePointer || !window.requestAnimationFrame) return;

  var VERT_SRC =
    "attribute vec2 aPosition;" +
    "varying vec2 vUv;" +
    "void main() {" +
    "  vUv = vec2((aPosition.x + 1.0) * 0.5, (1.0 - aPosition.y) * 0.5);" +
    "  gl_Position = vec4(aPosition, 0.0, 1.0);" +
    "}";

  // Diagnostic (étape 1, volontairement fort) : rayon ~150px, intensité
  // élevée, pour confirmer visuellement que la déformation existe avant de
  // revenir à quelque chose de subtil (étape 2).
  var FRAG_SRC =
    "precision mediump float;" +
    "varying vec2 vUv;" +
    "uniform sampler2D uTexture;" +
    "uniform vec2 uCanvasSize;" +
    "uniform vec2 uImageSize;" +
    "uniform vec2 uOffsetPx;" +
    "uniform float uScale;" +
    "uniform vec2 uMouse;" +
    "uniform float uRadiusPx;" +
    "uniform float uStrengthPx;" +
    "uniform vec3 uFallbackColor;" +
    "void main() {" +
    "  float aspect = uCanvasSize.x / uCanvasSize.y;" +
    "  vec2 diff = vUv - uMouse;" +
    "  diff.x *= aspect;" +
    "  float distPx = length(diff) * uCanvasSize.y;" +
    "  float falloff = 1.0 - smoothstep(0.0, uRadiusPx, distPx);" +
    "  vec2 dir = distPx > 0.5 ? normalize(diff) : vec2(0.0);" +
    "  vec2 dirUv = vec2(dir.x / aspect, dir.y);" +
    "  float strengthUv = uStrengthPx / uCanvasSize.y;" +
    "  vec2 distortedUv = vUv - dirUv * falloff * strengthUv;" +
    "  vec2 imgPx = (distortedUv * uCanvasSize - uOffsetPx) / uScale;" +
    "  vec2 imgUv = imgPx / uImageSize;" +
    "  if (imgUv.x < 0.0 || imgUv.x > 1.0 || imgUv.y < 0.0 || imgUv.y > 1.0) {" +
    "    gl_FragColor = vec4(uFallbackColor, 1.0);" +
    "  } else {" +
    "    gl_FragColor = texture2D(uTexture, imgUv);" +
    "  }" +
    "}";

  function compileShader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function init() {
    var heroEl = document.getElementById("universe-intro");
    if (!heroEl) return;

    var computed = window.getComputedStyle(heroEl);
    var bgImage = computed.backgroundImage;
    var match = bgImage && bgImage.match(/url\(["']?(.*?)["']?\)/);
    if (!match || !match[1]) return;
    var imageUrl = match[1];

    var canvas = document.createElement("canvas");
    canvas.className = "universe-intro__distortion-canvas";
    canvas.setAttribute("aria-hidden", "true");

    var gl = null;
    try {
      gl = canvas.getContext("webgl", { alpha: false, antialias: true, preserveDrawingBuffer: false }) ||
        canvas.getContext("experimental-webgl", { alpha: false, antialias: true, preserveDrawingBuffer: false });
    } catch (e) {
      gl = null;
    }
    if (!gl) return;

    var vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    var quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    var aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    var uTexture = gl.getUniformLocation(program, "uTexture");
    var uCanvasSize = gl.getUniformLocation(program, "uCanvasSize");
    var uImageSize = gl.getUniformLocation(program, "uImageSize");
    var uOffsetPx = gl.getUniformLocation(program, "uOffsetPx");
    var uScale = gl.getUniformLocation(program, "uScale");
    var uMouse = gl.getUniformLocation(program, "uMouse");
    var uRadiusPx = gl.getUniformLocation(program, "uRadiusPx");
    var uStrengthPx = gl.getUniformLocation(program, "uStrengthPx");
    var uFallbackColor = gl.getUniformLocation(program, "uFallbackColor");

    var img = new Image();
    img.onload = function () {
      try {
        startRendering(heroEl, canvas, gl, img, {
          uTexture: uTexture, uCanvasSize: uCanvasSize, uImageSize: uImageSize,
          uOffsetPx: uOffsetPx, uScale: uScale, uMouse: uMouse,
          uRadiusPx: uRadiusPx, uStrengthPx: uStrengthPx, uFallbackColor: uFallbackColor
        });
      } catch (e) {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
    img.onerror = function () {
      // L'image ne charge pas : aucun canvas n'est inséré, le fond CSS
      // s'affiche seul (comportement strictement identique à avant).
    };
    img.src = imageUrl;

    heroEl.appendChild(canvas);
  }

  function startRendering(heroEl, canvas, gl, img, u) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = 0;
    var cssH = 0;
    var heroTopDoc = 0;
    var imgW = img.naturalWidth || 1920;
    var imgH = img.naturalHeight || 1080;

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(u.uTexture, 0);
    gl.uniform2f(u.uImageSize, imgW, imgH);
    // Couleur de repli identique au background-color CSS de #universe-intro
    // (#9EBDD2), pour un letterboxing invisible, cohérent avec l'existant.
    gl.uniform3f(u.uFallbackColor, 0.6196, 0.7412, 0.8235);

    function computeLayout() {
      var rect = heroEl.getBoundingClientRect();
      heroTopDoc = rect.top + window.scrollY;
      cssW = heroEl.clientWidth;
      cssH = heroEl.clientHeight;
      if (cssW < 1 || cssH < 1) return;

      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);

      var scale = Math.min(cssW / imgW, cssH / imgH);
      var offsetX = cssW - imgW * scale; // right : tout l'excédent horizontal à gauche
      var offsetY = (cssH - imgH * scale) / 2; // center : excédent vertical réparti également

      gl.uniform2f(u.uCanvasSize, cssW, cssH);
      gl.uniform2f(u.uOffsetPx, offsetX, offsetY);
      gl.uniform1f(u.uScale, scale);
    }

    computeLayout();
    window.addEventListener("resize", computeLayout, { passive: true });
    window.addEventListener("load", computeLayout, { passive: true });

    var heroVisible = true;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          heroVisible = entries[0].isIntersecting;
        },
        { threshold: 0 }
      );
      io.observe(heroEl);
    }

    var rawX = window.innerWidth / 2;
    var rawY = window.innerHeight / 2;
    var curX = rawX;
    var curY = rawY;
    var prevX = rawX;
    var prevY = rawY;
    var strength = 0;
    var lastFrameAt = performance.now();

    // ÉTAPE 1 — diagnostic volontairement fort, à réduire ensuite avec
    // l'utilisateur une fois le fonctionnement confirmé visuellement.
    var RADIUS_PX = 150;
    var STRENGTH_BASE_PX = 25;
    var STRENGTH_SPEED_PX = 35;

    function onMove(e) {
      rawX = e.clientX;
      rawY = e.clientY;
    }
    window.addEventListener("mousemove", onMove, { passive: true });

    function frame(now) {
      window.requestAnimationFrame(frame);
      if (!heroVisible || cssW < 1 || cssH < 1) return;

      var dt = Math.max(now - lastFrameAt, 1);
      lastFrameAt = now;

      curX += (rawX - curX) * 0.16;
      curY += (rawY - curY) * 0.16;

      var vx = (curX - prevX) / dt;
      var vy = (curY - prevY) / dt;
      var speed = Math.min(Math.sqrt(vx * vx + vy * vy) * 18, 1);
      prevX = curX;
      prevY = curY;

      var targetStrength = STRENGTH_BASE_PX + speed * STRENGTH_SPEED_PX;
      strength += (targetStrength - strength) * 0.15;

      var heroTopViewport = heroTopDoc - window.scrollY;
      var localX = curX;
      var localY = curY - heroTopViewport;

      gl.uniform2f(u.uMouse, localX / cssW, localY / cssH);
      gl.uniform1f(u.uRadiusPx, RADIUS_PX);
      gl.uniform1f(u.uStrengthPx, strength);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    window.requestAnimationFrame(frame);
  }

  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  } catch (e) {
    // Aucune conséquence : le fond CSS de #universe-intro reste affiché
    // seul, exactement comme avant l'ajout de ce fichier.
  }
})();
