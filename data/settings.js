/**
 * VAGABON — data/settings.js
 * Réglages globaux du site. Fichier central : modifiez ici les liens
 * sociaux, l'e-mail de contact, l'URL Calendly, le fichier audio, etc.
 * Chargé en <script> classique (pas de module) afin de rester utilisable
 * directement avec Live Server, avant toute page qui en a besoin.
 */

/* eslint-disable no-unused-vars */
const VAGABON_SETTINGS = {
  siteName: "Vagabon",
  founder: "Virgil Boukraa",
  tagline: "Studio créatif indépendant",

  /** Adresse e-mail affichée et utilisée comme destinataire du formulaire. */
  contactEmail: "virgil.bkr51@outlook.fr",

  /** Zone d'activité (aucune adresse postale publique, cf. section 34). */
  location: {
    city: "Reims",
    extended: "Reims · Paris · Lille · France entière à distance",
  },

  /**
   * Réseaux sociaux. Laissez la chaîne vide tant que le lien n'est pas
   * disponible : les composants qui lisent ces valeurs (voir
   * js/data-renderer.js → renderSocialLinks) masquent automatiquement
   * tout réseau vide plutôt que de générer un lien cassé.
   */
  socialLinks: {
    linkedin: "",
    instagram: "",
    behance: "",
  },

  /**
   * URL Calendly. Remplacez cette constante par l'URL réelle de votre
   * page de réservation (ex. "https://calendly.com/vagabon/appel-decouverte").
   * Tant qu'elle est vide ou reste sur le placeholder, js/calendly.js
   * désactive proprement le bouton sans provoquer d'erreur.
   */
  calendlyUrl: "https://calendly.com/votre-identifiant/appel-decouverte",

  /**
   * Fichier audio d'ambiance. Déposez le fichier dans assets/audio/ et
   * mettez à jour ce chemin. Voir js/audio.js : si le fichier est absent,
   * le bouton son est automatiquement désactivé sans erreur bloquante.
   */
  audioTrack: "assets/audio/ambiance.mp3",

  /**
   * Navigation principale — intitulés standards + appellations narratives.
   * Nettoyage du site : les entrées de l'ancien portfolio (about/services/
   * projects/testimonials/articles/contact) ont été retirées avec les
   * pages correspondantes. Cette liste n'est lue par aucun script (le
   * menu de index.html est codé en dur dans le HTML) ; elle est conservée
   * à titre de configuration de référence pour la future navigation.
   */
  navigation: [
    { href: "/index.html", label: "Accueil", narrative: "Le Prologue", key: "home" },
  ],

  /** Formulaire de contact : mode démonstration tant qu'aucun service n'est branché. */
  formDemoMode: true,
};
