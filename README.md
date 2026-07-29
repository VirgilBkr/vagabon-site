# Vagabon — Portfolio professionnel de Virgil Boukraa

Site vitrine du studio créatif indépendant **Vagabon**, fondé par **Virgil Boukraa**
(Reims · Paris · Lille · France entière, à distance).

Ce dépôt correspond à la **phase 1** du projet : architecture complète, toutes
les pages, tous les composants, navigation, structure éditoriale, formulaires,
emplacements média, données de contenu, responsive design, accessibilité,
structure SEO et fonctionnalités essentielles. La direction artistique
spectaculaire (vidéos définitives, animations cinématographiques, éléments
3D...) est prévue pour la **phase 2**.

Site 100 % statique : HTML5, CSS3 et JavaScript natif (aucun framework,
aucune étape de compilation). Il fonctionne directement avec Live Server ou
un simple serveur HTTP local.

---

## 1. Présentation du projet

Vagabon se positionne comme un studio créatif indépendant premium — pas un
simple exécutant — construit autour de l'identité visuelle, la création
graphique, la vidéo, l'UI/UX et la stratégie de communication. Le site
s'adresse aux freelances, TPE, PME, associations sportives, commerçants et
porteurs de projet, avec une attention particulière portée au sport, à
l'art, à la culture, à la restauration et à l'événementiel.

Objectifs principaux : présenter Virgil et Vagabon, valoriser les
compétences et les services, démontrer la créativité via le site lui-même,
et générer des demandes de contact ou des réservations d'appel découverte.
Aucun tarif n'est affiché sur le site.

---

## 2. Architecture des dossiers

```
vagabon-portfolio/
├── index.html, about.html, services.html, projects.html,
│   testimonials.html, articles.html, contact.html,
│   legal.html, privacy.html, 404.html
├── projects/face-a-face.html          → étude de cas complète
├── articles/article-template.html     → modèle unique d'article
├── css/                                → reset, variables, base, layout,
│   │                                     components, utilities, animations,
│   │                                     responsive
│   └── pages/                          → un fichier par page
├── js/                                  → un module par fonctionnalité
├── data/                                → contenus modifiables (JS simple)
├── assets/                              → images, vidéos, audio, icônes,
│                                          documents, fonts (placeholders +
│                                          README par sous-dossier)
├── robots.txt, sitemap.xml, site.webmanifest, favicon.svg
└── README.md
```

Le header et le footer sont dupliqués dans chaque page HTML (site statique,
pas de moteur de templating). Leur structure est strictement identique
partout : si vous modifiez le header ou le footer, reportez le changement
dans **toutes** les pages. Chaque bloc est commenté (`<!-- HEADER -->`,
`<!-- FOOTER -->`) pour faciliter le repérage.

---

## 3. Lancer le site en local

### Avec Live Server (VS Code)

1. Ouvrez le dossier du projet dans VS Code.
2. Installez l'extension "Live Server" si besoin.
3. Clic droit sur `index.html` → "Open with Live Server".

### Avec Python

```bash
python -m http.server 5500
```

Puis ouvrez `http://localhost:5500/index.html` dans votre navigateur.

Aucune étape de build n'est nécessaire : le site fonctionne tel quel.

---

## 4. Où modifier le contenu

| Élément | Fichier(s) à modifier |
|---|---|
| Couleurs | `css/variables.css` (variables `--color-*`) |
| Typographies | `css/variables.css` (`--font-display` = Good Times, `--font-body` = Stigsa Display) + `css/base.css` (déclarations `@font-face` commentées, avec `local()` pour tester sur Mac) + fichiers à déposer dans `assets/fonts/good-times/` et `assets/fonts/stigsa-display/` (voir `assets/fonts/README.md`) |
| Logo | Remplacer les `.media-placeholder` par de vraies balises `<img>`/`<svg>` pointant vers `assets/images/brand/` (voir `assets/images/brand/README.md`) |
| Textes des pages | Directement dans chaque fichier `.html` |
| Services | `data/services.js` |
| Projets | `data/projects.js` (+ créer la page d'étude de cas si besoin) |
| Articles | `data/articles.js` |
| Témoignages | `data/testimonials.js` |
| Réseaux sociaux | `data/settings.js` → `socialLinks` |
| Lien Calendly | `data/settings.js` → `calendlyUrl` |
| Adresse e-mail de contact | `data/settings.js` → `contactEmail` (+ tous les `mailto:` dans le HTML) |
| Fichier audio | `data/settings.js` → `audioTrack` + déposer le fichier dans `assets/audio/` |
| Vidéo du Hero (accueil) | `assets/videos/hero/vagabon-hero-background.mp4` (remplacer le fichier en gardant le même nom, ou mettre à jour le `<source>` dans `index.html` → `.home-hero__video`) + poster `assets/images/hero/vagabon-hero-poster.webp` |

---

## 4bis. Vidéo d'arrière-plan du Hero (page d'accueil)

Le Hero de `index.html` utilise une vidéo plein écran en boucle plutôt qu'un
visuel statique :

- **Fichier** : `assets/videos/hero/vagabon-hero-background.mp4` (1920×1080,
  H.264, ~4 s, ~2,7 Mo).
- **Poster** : `assets/images/hero/vagabon-hero-poster.webp`, une image
  extraite directement de la vidéo (et non un visuel générique), posée en
  fond CSS de `.home-hero__media`. Il reste affiché tant que la vidéo n'est
  pas prête, si l'autoplay est bloqué par le navigateur, ou si JavaScript
  est désactivé — le Hero n'est donc jamais vide.
- **Comportement** : autoplay, muet (`muted`), en boucle (`loop`),
  `playsinline` pour iOS, sans contrôles, sans capter les clics
  (`pointer-events: none`). La piste audio intégrée au fichier n'est
  jamais utilisée : le bouton son du header pilote uniquement le système
  audio séparé (`js/audio.js` / `data/settings.js` → `audioTrack`).
- **prefers-reduced-motion / prefers-reduced-data** : la vidéo est mise en
  pause sur son premier photogramme dès que l'une de ces préférences est
  détectée (voir `initHeroVideo()` dans `js/animations.js`) ; le contenu et
  le bouton « Entrer dans l'univers » restent inchangés et fonctionnels.
- **Thème** : ce Hero reste volontairement sombre (texte blanc, overlay
  foncé) dans les deux thèmes clair/sombre du site — décision documentée
  directement dans `index.html` et dans `css/pages/home.css`
  (`.home-hero--video`). Le reste du site continue de suivre normalement
  le thème sélectionné.

**Remplacer la vidéo :** déposez le nouveau fichier dans
`assets/videos/hero/` (idéalement sous 5-8 Mo, H.264 encodé pour le web) et
régénérez un poster avec, par exemple :
```bash
ffmpeg -ss 1.2 -i votre-video.mp4 -frames:v 1 -vf "scale=1920:-1" assets/images/hero/vagabon-hero-poster.webp
```

---

## 5. Ajouter un projet

1. Ajoutez une entrée dans `data/projects.js` (`VAGABON_PROJECTS`), en
   suivant la structure de l'entrée `face-a-face` existante.
2. Créez le dossier média correspondant : `assets/images/projects/<slug>/`.
3. Si le projet mérite une étude de cas complète, dupliquez
   `projects/face-a-face.html` en `projects/<slug>.html` et adaptez le
   contenu (voir section suivante).
4. Le rendu de la grille sur `projects.html` se met à jour automatiquement
   via `js/data-renderer.js`.

## 6. Créer une nouvelle étude de cas

Dupliquez `projects/face-a-face.html`, puis :
- mettez à jour `<title>`, meta description, `canonical`, les données
  structurées JSON-LD (`BreadcrumbList`) ;
- adaptez la fiche mission, le contexte, la problématique, les objectifs,
  la stratégie et les livrables ;
- remplacez les `.media-placeholder` par les médias réels au fur et à
  mesure qu'ils sont disponibles (chaque emplacement est commenté
  `<!-- REMPLACER : ... -->` dans le HTML) ;
- ajoutez l'entrée correspondante dans `data/projects.js`.

## 7. Ajouter un article

1. Ajoutez une entrée dans `data/articles.js` (`VAGABON_ARTICLES`).
2. En phase 1, tous les articles pointent vers le gabarit unique
   `articles/article-template.html`. Pour publier un article distinct avec
   son propre contenu, dupliquez ce fichier (voir le commentaire en tête du
   fichier) et changez l'`url` correspondante dans `data/articles.js`.
3. Créez le dossier `assets/images/articles/<slug>/` pour les visuels.

---

## 8. Comment connecter le formulaire de contact

Le formulaire (`contact.html`) fonctionne actuellement en **mode
démonstration** (voir `js/forms.js` → `submitContactFormDemo()`) : aucun
e-mail n'est réellement envoyé. Le message affiché à l'utilisateur le
précise explicitement.

Pour connecter un envoi réel, remplacez le contenu de la fonction
`submitContactFormDemo()` dans `js/forms.js` par l'une de ces options :

**Option A — Netlify Forms** (si le site est déployé sur Netlify)
- Ajoutez `data-netlify="true"` et un champ caché `form-name` au `<form>`.
- Netlify capte alors les soumissions sans code serveur supplémentaire.

**Option B — Formspree**
```js
function submitContactFormDemo(payload) {
  return fetch("https://formspree.io/f/VOTRE_ID", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  }).then((res) => ({ ok: res.ok }));
}
```

**Option C — Fonction serverless** (Netlify Functions, Vercel, AWS Lambda...)
- Créez une fonction qui reçoit le payload et envoie l'e-mail via un service
  comme Resend, SendGrid ou Brevo, puis appelez cette fonction en `fetch()`
  depuis `submitContactFormDemo()`.

Dans tous les cas, mettez à jour `VAGABON_SETTINGS.formDemoMode = false`
dans `data/settings.js` une fois le service branché, et adaptez le message
de succès affiché à l'utilisateur.

## 9. Comment connecter la newsletter

Même logique dans `js/newsletter.js`. Options recommandées : **Brevo**,
**Mailchimp**, ou une fonction serverless dédiée. Remplacez le
`console.info(...)` de démonstration par un appel à l'API du service choisi.

## 10. Comment connecter Calendly

1. Créez votre page de réservation sur Calendly.
2. Remplacez `VAGABON_SETTINGS.calendlyUrl` dans `data/settings.js` par
   l'URL réelle (ex. `https://calendly.com/vagabon/appel-decouverte`).
3. Les boutons `[data-calendly-button]` ouvrent alors automatiquement
   Calendly dans un nouvel onglet.
4. Pour un widget intégré (iframe) plutôt qu'un nouvel onglet, décommentez
   le bloc prévu dans `js/calendly.js` → `initCalendlyEmbed()`.

Tant que l'URL reste sur le placeholder, les boutons affichent un message
clair invitant à utiliser le formulaire — jamais d'erreur ni de lien cassé.

---

## 11. Comment remplacer les placeholders média

Chaque emplacement média (image, vidéo, logo) est un bloc
`.media-placeholder` qui précise : son rôle, le format attendu, les
dimensions recommandées et le nom de fichier suggéré. Pour le remplacer :

1. Déposez le fichier réel dans le sous-dossier `assets/` indiqué (chaque
   sous-dossier contient un `README.md` détaillant les fichiers attendus).
2. Remplacez le bloc `<div class="media-placeholder">...</div>` (ou
   `<a>`/`<span>` selon le contexte) par la balise `<img>` ou `<video>`
   correspondante, avec `width`, `height`, `alt` et `loading="lazy"` (sauf
   pour l'élément principal au-dessus de la ligne de flottaison).

---

## 12. Comment activer la version anglaise

L'architecture bilingue est prête :
- `data/translations.js` contient un dictionnaire `fr` / `en` pour les
  éléments d'interface récurrents (navigation, boutons, formulaires,
  footer) — chaque clé anglaise provisoire est marquée `(EN provisoire)` et
  doit être relue par un traducteur.
- `js/language.js` gère le sélecteur FR/EN, mémorise le choix et traduit
  tout élément portant `data-i18n` ou `data-i18n-attr`.

Pour une traduction complète (contenus longs des pages), il faudra en
phase 2 : dupliquer chaque page en version `.en.html` (ou mettre en place
un système de contenu séparé par langue), et enrichir
`data/translations.js` avec les textes longs traduits et validés.

---

## 13. Déployer sur GitHub Pages

1. Poussez ce dossier sur un dépôt GitHub.
2. Dans les réglages du dépôt → **Pages**, choisissez la branche
   principale et le dossier racine (`/`).
3. GitHub Pages sert directement les fichiers statiques : aucune étape de
   build n'est nécessaire.
4. Une fois le domaine connu, mettez à jour les URLs `canonical`, Open
   Graph, `sitemap.xml` et `robots.txt` (actuellement sur un domaine
   placeholder `https://www.vagabon-exemple.fr`).

---

## 14. Limites de la version actuelle (phase 1)

- Le formulaire de contact et le formulaire newsletter fonctionnent en
  **mode démonstration** : aucun e-mail n'est réellement transmis.
- Aucune image, vidéo ou police officielle n'est intégrée : tout est
  représenté par des `.media-placeholder` clairement identifiés.
- Le lien Calendly pointe vers un placeholder (`votre-identifiant`).
- Les liens sociaux (LinkedIn, Instagram, Behance) sont vides et donc
  masqués/désactivés automatiquement.
- Un seul projet réel (Face à Face) et trois articles éditoriaux
  provisoires (contenu à finaliser) sont présents.
- La traduction anglaise ne couvre que l'interface (chrome), pas les
  textes longs de chaque page.
- Aucune animation cinématographique, parallaxe ou élément 3D — ils sont
  volontairement réservés à la phase 2.

## 15. Éléments prévus pour la phase 2

- Intégration des fichiers officiels de marque (SVG wordmark, monogramme,
  papillon) et des polices **Good Times** (titres) et **Stigsa Display**
  (textes courants) — voir `assets/fonts/README.md`. Ces polices sont déjà
  installées sur le Mac de Virgil mais doivent être fournies en fichiers web
  (WOFF2 de préférence) pour s'afficher chez les visiteurs ; une conversion
  légale vers WOFF2 est recommandée si seuls des fichiers OTF/TTF existent.
- Médias définitifs (photos, vidéos, flyer) pour l'étude de cas Face à Face.
- Animations cinématographiques avancées : GSAP, ScrollTrigger, Lenis,
  SplitType, parallaxes, sections épinglées, transitions entre pages — les
  attributs `data-reveal`, `data-parallax`, `data-animation-group` sont déjà
  posés dans le HTML pour préparer cette intégration sans tout réécrire.
- Connexion réelle du formulaire de contact, de la newsletter et de
  Calendly.
- Traduction anglaise complète des contenus longs.
- Nouveaux projets, articles et témoignages réels au fil des missions.

---

## Fonctionnalités opérationnelles dès maintenant

- Navigation complète (header, menu plein écran accessible clavier/tactile/lecteur d'écran).
- Mode sombre/clair avec mémorisation et anti-flash.
- Sélecteur FR/EN (interface).
- Filtres de projets et d'articles (JS, accessibles au clavier).
- Curseur personnalisé (désactivé sur tactile et `prefers-reduced-motion`).
- Loader accessible avec durée maximale.
- Validation complète du formulaire de contact (HTML + JS), honeypot anti-spam.
- Responsive testé de 1440px à 375px.
- SEO de base : title/description uniques, canonical, Open Graph, Twitter
  Cards, JSON-LD (Person, ProfessionalService, BreadcrumbList, Article),
  sitemap.xml, robots.txt.

## Fonctionnalités en mode démonstration uniquement

- Envoi du formulaire de contact (aucun e-mail réel).
- Inscription newsletter (aucune adresse transmise à un service externe).
- Bouton Calendly (ouvre un message d'information tant que l'URL réelle
  n'est pas renseignée).
- Ambiance sonore (aucun fichier audio fourni par défaut).
