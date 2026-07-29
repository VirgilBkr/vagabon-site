/**
 * VAGABON — js/forms.js
 * Validation + soumission du formulaire de contact (contact.html uniquement
 * — ce script ne fait rien sur les pages qui n'ont pas #contact-form).
 *
 * IMPORTANT — MODE DÉMONSTRATION :
 * Aucun backend ni service d'envoi n'est connecté pour l'instant. Ce script
 * ne prétend JAMAIS avoir envoyé un e-mail réel : tant que
 * VAGABON_SETTINGS.formDemoMode est à true (voir data/settings.js), la
 * soumission valide déclenche la confirmation visuelle demandée, mais un
 * message distinct et honnête ("mode démonstration") est affiché à côté,
 * précisant qu'aucun message n'a réellement été transmis.
 *
 * POUR CONNECTER UN VRAI ENVOI :
 * 1. Choisissez un service (Formspree, Netlify Forms, EmailJS, ou une
 *    fonction serverless personnelle).
 * 2. Remplacez le contenu de sendContactFormReal() ci-dessous par l'appel
 *    réseau correspondant (un exemple Formspree est fourni en commentaire).
 * 3. Passez VAGABON_SETTINGS.formDemoMode à false dans data/settings.js.
 * Aucune autre modification n'est nécessaire : submitForm() bascule
 * automatiquement vers sendContactFormReal() dès que formDemoMode est faux.
 */

(function () {
  "use strict";

  function getSettings() {
    return window.VAGABON_SETTINGS || {};
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  /**
   * Traduction des messages de validation/erreur du formulaire : lit la
   * langue actuellement active (document.documentElement.lang, pilotée par
   * js/language.js) dans le dictionnaire partagé VAGABON_TRANSLATIONS, avec
   * repli sur le texte français fourni si le dictionnaire est indisponible.
   * Évite que le formulaire affiche des messages français alors que
   * l'utilisateur a choisi l'anglais (section 4 du brief bilingue).
   */
  function t(key, fallback) {
    try {
      var lang = document.documentElement.getAttribute("lang") === "en" ? "en" : "fr";
      var dict = window.VAGABON_TRANSLATIONS && window.VAGABON_TRANSLATIONS[lang];
      if (dict && dict[key]) return dict[key];
    } catch (e) {
      /* silencieux : repli sur le texte français fourni */
    }
    return fallback;
  }

  /**
   * Validation d'un champ unique. Retourne un message d'erreur (chaîne) ou
   * null si le champ est valide. Le budget et l'entreprise sont toujours
   * facultatifs et ne peuvent jamais renvoyer d'erreur.
   */
  function validateField(field) {
    const value = field.value.trim();
    const name = field.name;

    if (name === "name") {
      if (!value) return t("form.err_name_required", "Merci d'indiquer votre prénom et votre nom.");
      return null;
    }

    if (name === "email") {
      if (!value) return t("form.err_email_required", "Merci d'indiquer une adresse e-mail.");
      // Vérification simple mais robuste, cohérente avec le message existant
      // du dictionnaire de traduction (form.invalid_email).
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) return t("form.invalid_email", "Merci de renseigner une adresse e-mail valide.");
      return null;
    }

    if (name === "projectType") {
      if (!value) return t("form.err_project_type_required", "Merci de sélectionner un type de projet.");
      return null;
    }

    if (name === "message") {
      if (!value) return t("form.err_message_required", "Parlez-moi un peu de votre idée avant d'envoyer.");
      if (value.length < 10) return t("form.err_message_short", "Un message un peu plus détaillé nous aidera à mieux vous répondre.");
      return null;
    }

    return null;
  }

  function showFieldError(field, message) {
    const group = field.closest(".contact-field");
    if (!group) return;
    const errorEl = group.querySelector(".contact-field__error");
    field.setAttribute("aria-invalid", "true");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add("is-visible");
    }
  }

  function clearFieldError(field) {
    const group = field.closest(".contact-field");
    if (!group) return;
    const errorEl = group.querySelector(".contact-field__error");
    field.removeAttribute("aria-invalid");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.remove("is-visible");
    }
  }

  /**
   * Simule un envoi (mode démonstration) : ne transmet rien, ne contacte
   * aucun service. Résout après un court délai pour rester perceptible et
   * crédible côté interface, sans jamais prétendre qu'un e-mail est parti.
   */
  function sendContactFormDemo() {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        resolve({ ok: true, demo: true });
      }, 600);
    });
  }

  /**
   * Emplacement prévu pour un envoi réel. Non utilisé tant que
   * VAGABON_SETTINGS.formDemoMode est à true. Exemple Formspree fourni en
   * commentaire — remplacez VOTRE_ID par l'identifiant réel une fois créé.
   */
  function sendContactFormReal(payload) {
    // return fetch("https://formspree.io/f/VOTRE_ID", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json", Accept: "application/json" },
    //   body: JSON.stringify(payload),
    // }).then(function (res) { return { ok: res.ok, demo: false }; });

    return Promise.reject(new Error("Aucun service d'envoi connecté (voir js/forms.js)."));
  }

  function submitPayload(payload) {
    const settings = getSettings();
    if (settings.formDemoMode === false) {
      return sendContactFormReal(payload);
    }
    return sendContactFormDemo();
  }

  function initContactForm() {
    const form = qs("#contact-form");
    if (!form) return;

    const wrapper = form.closest(".contact-hero__form-block");
    const submitButton = qs(".contact-form__submit", form);
    const globalError = wrapper ? qs(".contact-form__global-error", wrapper) : null;
    const demoNote = wrapper ? qs(".contact-form__demo-note", wrapper) : null;
    const fields = Array.prototype.slice.call(form.querySelectorAll("[name]"));

    fields.forEach(function (field) {
      field.addEventListener("blur", function () {
        const message = validateField(field);
        if (message) {
          showFieldError(field, message);
        } else {
          clearFieldError(field);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (globalError) globalError.classList.remove("is-visible");

      let firstInvalid = null;
      fields.forEach(function (field) {
        const message = validateField(field);
        if (message) {
          showFieldError(field, message);
          if (!firstInvalid) firstInvalid = field;
        } else {
          clearFieldError(field);
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const payload = {
        name: qs('[name="name"]', form).value.trim(),
        email: qs('[name="email"]', form).value.trim(),
        company: qs('[name="company"]', form).value.trim(),
        projectType: qs('[name="projectType"]', form).value,
        budget: qs('[name="budget"]', form).value.trim(),
        message: qs('[name="message"]', form).value.trim(),
      };

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add("is-loading");
      }

      submitPayload(payload)
        .then(function (result) {
          if (wrapper) wrapper.classList.add("is-success");
          if (demoNote) demoNote.style.display = result && result.demo === false ? "none" : "";
          // Focus déplacé sur la confirmation pour les lecteurs d'écran.
          const successPanel = wrapper ? qs(".contact-form__success", wrapper) : null;
          if (successPanel) {
            successPanel.setAttribute("tabindex", "-1");
            successPanel.focus();
          }
        })
        .catch(function () {
          if (globalError) {
            globalError.textContent = t("form.err_generic", "Une erreur est survenue. Merci de réessayer, ou d'écrire directement par e-mail.");
            globalError.classList.add("is-visible");
          }
        })
        .finally(function () {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove("is-loading");
          }
        });
    });
  }

  function init() {
    initContactForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
