/**
 * VAGABON — js/navigation.js
 * Header + menu plein écran. Entièrement utilisable au clavier, à la
 * souris, au tactile et avec un lecteur d'écran (section 10 du brief) :
 * - piège le focus dans le menu tant qu'il est ouvert ;
 * - ferme au clavier avec Échap ;
 * - restitue le focus au bouton d'ouverture à la fermeture ;
 * - empêche le scroll de l'arrière-plan ;
 * - fonctionne même si les animations sont désactivées.
 */

(function () {
  "use strict";

  function initHeaderScrollState() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function getFocusable(container) {
    return Array.from(
      container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.offsetParent !== null; });
  }

  function initFullscreenMenu() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-nav-menu]");
    if (!toggle || !menu) return;

    let lastFocused = null;

    function trapFocus(event) {
      if (event.key !== "Tab") return;
      const focusable = getFocusable(menu);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function openMenu() {
      lastFocused = document.activeElement;
      menu.setAttribute("data-open", "true");
      menu.removeAttribute("aria-hidden");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-locked");
      const focusable = getFocusable(menu);
      if (focusable[0]) focusable[0].focus();
      document.addEventListener("keydown", onKeydown);
    }

    function closeMenu() {
      menu.setAttribute("data-open", "false");
      menu.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-locked");
      document.removeEventListener("keydown", onKeydown);
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      } else {
        toggle.focus();
      }
    }

    function onKeydown(event) {
      if (event.key === "Escape") {
        closeMenu();
      } else {
        trapFocus(event);
      }
    }

    toggle.addEventListener("click", function () {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMenu(); else openMenu();
    });

    menu.querySelectorAll("[data-menu-close]").forEach(function (el) {
      el.addEventListener("click", closeMenu);
    });

    // Ferme automatiquement le menu si on clique un lien de navigation
    menu.querySelectorAll("a[href]").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }

  /** Marque le lien de navigation correspondant à la page actuelle. */
  function markActiveLink() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav-link]").forEach(function (link) {
      const linkPath = link.getAttribute("href").split("/").pop();
      if (linkPath === currentPath) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function init() {
    initHeaderScrollState();
    initFullscreenMenu();
    markActiveLink();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
