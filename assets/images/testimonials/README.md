# assets/images/testimonials/

Portraits des personnes citées dans la section « Témoignages » de universe.html.

## Fichiers

- `zohir-remidi.webp` — 320×320px, noir et blanc — recadrage carré centré sur le visage, depuis une photo prise à la salle de boxe thaï (même séance que `assets/images/profile/boxe-thai.webp`)
- `jean-marc-guillot.webp` — 320×320px, noir et blanc — recadrage carré centré sur le visage, même photo source

## Traitement appliqué

Recadrage carré centré sur le visage (tête + un peu d'épaules, sans jamais couper le menton ni le sommet du crâne), même proportion de cadrage pour les deux photos afin de garder un rendu homogène dans les cercles `.testimonial-band__avatar`. Conversion en noir et blanc (`ImageOps.grayscale` + léger `autocontrast`) : la photo source est très colorée (tee-shirt Venum, maillot tricolore, verdure en arrière-plan) et jurait avec la charte froide et minimaliste du site (fond glacier, tons anthracite/doré) — le noir et blanc rapproche ces portraits du traitement déjà neutre des placeholders qu'ils remplacent. Export WebP qualité 88, 320×320px (2,8× la taille d'affichage maximale de 112px, pour un rendu net sur écrans rétina) via Pillow.

## Ajouter une nouvelle photo de témoignage

Suivre le même procédé : recadrage carré centré sur le visage, noir et blanc, export WebP ~320×320px, puis remplacer le
`<span class="testimonial-band__avatar-initials">…</span>` par
`<img class="testimonial-band__avatar-img" src="assets/images/testimonials/…" alt="" width="112" height="112" loading="lazy">`
à l'intérieur de `.testimonial-band__avatar`, dans **les deux** `.testimonial-band__set` de universe.html (le second, `aria-hidden="true"`, est la copie utilisée par la boucle infinie du carousel — voir js/universe.js, `initTestimonialCarousel()`).
