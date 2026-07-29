/**
 * VAGABON — js/language.js
 * Sélecteur FR / EN. Le français reste la langue de référence pour les
 * contenus longs en phase 1 ; ce module traduit les éléments d'interface
 * marqués data-i18n / data-i18n-attr à partir de data/translations.js
 * (doit être chargé avant ce script). Le choix est mémorisé et appliqué
 * à toutes les pages.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "vagabon-lang";

  function getDictionary(lang) {
    if (typeof VAGABON_TRANSLATIONS === "undefined") return null;
    return VAGABON_TRANSLATIONS[lang] || null;
  }

  function getStoredLang() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function storeLang(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      /* silencieux : la préférence ne sera simplement pas conservée */
    }
  }

  function applyTranslations(lang) {
    const dict = getDictionary(lang);
    if (!dict) return;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      const pairs = el.getAttribute("data-i18n-attr").split(",");
      pairs.forEach(function (pair) {
        const parts = pair.split(":");
        const attr = parts[0] && parts[0].trim();
        const key = parts[1] && parts[1].trim();
        if (attr && key && dict[key]) el.setAttribute(attr, dict[key]);
      });
    });

    document.documentElement.setAttribute("lang", lang);
  }

  function updateToggleButtons(lang) {
    document.querySelectorAll("[data-lang-toggle]").forEach(function (button) {
      button.textContent = lang === "fr" ? "EN" : "FR";
      button.setAttribute("aria-label", lang === "fr" ? "Switch to English" : "Passer en français");
    });
  }

  function initLanguage() {
    const lang = document.documentElement.getAttribute("lang") === "en" || getStoredLang() === "en" ? "en" : "fr";
    if (lang !== "fr") applyTranslations(lang);
    updateToggleButtons(lang);

    document.querySelectorAll("[data-lang-toggle]").forEach(function (button) {
      button.addEventListener("click", function () {
        const active = document.documentElement.getAttribute("lang") === "en" ? "fr" : "en";
        storeLang(active);
        applyTranslations(active);
        updateToggleButtons(active);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLanguage);
  } else {
    initLanguage();
  }
})();
