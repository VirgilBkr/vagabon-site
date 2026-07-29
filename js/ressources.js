/**
 * VAGABON — js/ressources.js
 *
 * Amélioration progressive de la grille Ressources : filtre par catégorie
 * + recherche texte, appliqués sur les cartes DÉJÀ PRÉSENTES dans le HTML
 * (générées côté serveur/à la publication — voir cms/workers/generate-page).
 * Aucun appel réseau ici : le filtrage se fait uniquement en montrant/
 * masquant les cartes existantes, ce qui garantit que Google et les
 * visiteurs sans JavaScript voient malgré tout la liste complète des
 * articles publiés (le filtre est un confort d'usage, pas une condition
 * d'accès au contenu).
 *
 * Portée strictement limitée à ressources.html — script chargé uniquement
 * sur cette page, sans dépendance à un autre module (pas de couplage avec
 * universe.js).
 */
(function () {
  'use strict';

  function normalize(str) {
    return (str || '')
      .toString()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  function init() {
    var grid = document.querySelector('[data-ressources-grid]');
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-ressources-card]'));
    var pills = Array.prototype.slice.call(document.querySelectorAll('[data-ressources-filter]'));
    var searchInput = document.querySelector('[data-ressources-search]');
    var emptyState = document.querySelector('[data-ressources-empty]');

    var activeCategory = 'all';

    function applyFilters() {
      var query = normalize(searchInput ? searchInput.value : '');
      var visibleCount = 0;

      cards.forEach(function (card) {
        var category = card.getAttribute('data-category') || '';
        var searchable = normalize(card.getAttribute('data-search') || card.textContent);
        var matchesCategory = activeCategory === 'all' || category === activeCategory;
        var matchesQuery = query === '' || searchable.indexOf(query) !== -1;
        var visible = matchesCategory && matchesQuery;

        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (emptyState) {
        emptyState.hidden = visibleCount !== 0;
      }
    }

    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        activeCategory = pill.getAttribute('data-ressources-filter') || 'all';
        pills.forEach(function (p) {
          p.setAttribute('aria-pressed', p === pill ? 'true' : 'false');
        });
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    // État initial (utile si un paramètre d'URL ?categorie= est un jour
    // ajouté pour le maillage interne des catégories — non actif pour
    // l'instant, aucun lien de ce type n'existe encore).
    applyFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
