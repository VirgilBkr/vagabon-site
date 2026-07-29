# assets/audio/

Ambiance sonore optionnelle du site (section 23 du brief).

## Fichier attendu

- `ambiance.mp3` — piste audio en boucle, courte, volume modéré. Le chemin est
  défini dans `data/settings.js` → `audioTrack`.

Tant que ce fichier est absent, `js/audio.js` désactive automatiquement le
bouton son sans provoquer d'erreur ni de son parasite. Le son ne démarre
jamais automatiquement : l'utilisateur doit cliquer sur le bouton dédié.
