# assets/fonts/

Emplacement pour les fichiers de police officiels de la charte typographique
Vagabon (section 24 du brief) :

- **Good Times** — titres (H1 à H6), surtitres, sous-titres, titres de cartes,
  de projets et d'articles, intitulés principaux du menu, boutons importants,
  labels éditoriaux majeurs, numéros de mission.
- **Stigsa Display** — tous les textes courants : paragraphes, descriptions,
  légendes, contenus d'articles, témoignages, champs de formulaire, messages
  de validation, footer, mentions légales, métadonnées.

**Recherche effectuée dans le projet (aucun fichier trouvé) :** `assets/fonts/`,
`fonts/`, `public/fonts/`, `static/fonts/`, ainsi que l'ensemble de
l'arborescence du projet (recherche insensible à la casse sur "good-times",
"goodtimes", "stigsa", "stigsa-display"). Aucun fichier `.woff`, `.woff2`,
`.otf` ou `.ttf` n'est actuellement présent. Aucun fichier n'a été récupéré
depuis une source externe non autorisée : ces polices sont actuellement
installées uniquement sur l'ordinateur de Virgil Boukraa, ce qui n'est pas
suffisant pour qu'elles s'affichent chez les visiteurs du site (voir
README.md racine).

## Structure attendue

```
assets/fonts/good-times/
  good-times.woff2                    (Regular — utilisation avec modération)
assets/fonts/stigsa-display/
  stigsa-display-regular.woff2
  stigsa-display-bold.woff2           (si une graisse Bold existe réellement)
```

Format recommandé : **WOFF2** en priorité, puis WOFF, puis OTF/TTF en dépannage
local uniquement (à convertir en WOFF2 avant mise en production, sous réserve
que la licence des polices l'autorise explicitement — ne jamais convertir ou
redistribuer une police sans droit de le faire).

## Activation

Les déclarations `@font-face` correspondantes sont déjà préparées, avec une
règle `local()` pour faciliter les tests sur le Mac de Virgil, mais restent
**commentées** dans `css/base.css` tant que les fichiers ne sont pas déposés
ici (pour ne jamais générer d'erreur 404 sur les navigateurs des visiteurs).

Une fois les fichiers copiés :
1. Décommentez le bloc `@font-face` dans `css/base.css`.
2. Vérifiez que les noms de fichiers dans `src: url(...)` correspondent
   exactement aux fichiers livrés.
3. Ajoutez le préchargement des variantes Regular sur les pages où le Hero
   ou un titre apparaît au-dessus de la ligne de flottaison :

```html
<!-- Dans <head>, avant les feuilles de style. Adapter le préfixe de chemin
     (../ pour les pages situées dans projects/ ou articles/). -->
<link rel="preload" href="assets/fonts/good-times/good-times.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/stigsa-display/stigsa-display-regular.woff2" as="font" type="font/woff2" crossorigin>
```

Ne précharger que les graisses Regular indispensables au premier écran — pas
l'ensemble des graisses et styles disponibles.

## Ne pas confondre avec le logo

Le mot-symbole Vagabon (le lettrage "VAGABON" du logo) n'est **jamais**
recréé avec Good Times ni avec aucune autre police : c'est un fichier
SVG/image dédié (voir `assets/images/brand/README.md`). Le composant
`.media-placeholder--logo` de `css/components.css` force volontairement
la police courante (Stigsa Display) sur ses légendes de remplacement, pour
qu'aucun texte de la charte ne puisse être confondu avec le logo officiel.
