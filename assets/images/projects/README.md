# assets/images/projects/

Ce dossier accueille les visuels de couverture de la section **Projets** de
`universe.html` (la page qui s'ouvre après le bouton « Entrer dans l'univers »
de la landing page).

Tant qu'un fichier n'est pas présent, `universe.html` affiche automatiquement
un fond dégradé sombre à la place (aucune icône d'image cassée) : vous pouvez
donc déposer les fichiers un par un, sans jamais casser la page.

## Fichiers attendus

Déposez ici des images nommées exactement ainsi (le nom exact est déjà
référencé dans `universe.html`, aucune modification de code n'est nécessaire) :

- `projet-01-couverture.jpg` (ou `.webp`) — recommandé : 2000×2500px environ (format portrait), poids optimisé pour le web
- `projet-02-couverture.jpg`
- `projet-03-couverture.jpg`
- `projet-04-couverture.jpg`

Format recommandé : portrait ou carré plutôt que paysage large (la mise en
page alterne des images assez hautes). `.webp` est préférable à `.jpg` pour
le poids, mais les deux fonctionnent : `universe.html` charge simplement le
chemin `assets/images/projects/projet-0X-couverture.<extension>` — adaptez
l'attribut `src` correspondant dans `universe.html` si vous utilisez une
extension différente de `.jpg`.

## Ajouter un vrai projet (titre, catégorie, description)

Le contenu textuel de chaque projet (numéro, titre, catégorie, description)
est directement dans `universe.html`, à l'intérieur de chaque bloc
`<article class="universe-project" ...>`. Cherchez les commentaires
`<!-- À REMPLACER -->` : ils indiquent précisément quoi modifier pour chaque
projet, sans toucher au reste de la mise en page ni aux animations.

## Ajouter un 5e projet (ou plus)

Dupliquez un bloc `<article class="universe-project">` existant dans
`universe.html` (avec son numéro et son image), incrémentez le numéro
(`05`, `06`...), et ajoutez le fichier image correspondant ici.
