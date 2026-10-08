/**
 * catalog.js - Modulo atomico para gestion del catalogo bento grid
 * Permite busqueda en tiempo real y filtrado por categorias accesible (aria-pressed, hidden)
 */

export function initCatalog() {
    const filterContainer = document.getElementById('filterContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const cards = document.querySelectorAll('.bento-item');
    const noResultsMsg = document.getElementById('noResultsMsg');
    const bentoGrid = document.getElementById('bentoGrid');

    if (!cards.length || !bentoGrid) return;

    let currentFilter = 'all';
    let currentSearch = '';

    // Guardar distribucion visual inicial
    cards.forEach(card => {
        if (card.classList.contains('item-large')) card.dataset.layout = 'item-large';
        else if (card.classList.contains('item-tall')) card.dataset.layout = 'item-tall';
        else if (card.classList.contains('item-wide')) card.dataset.layout = 'item-wide';
        else card.dataset.layout = 'item-normal';
    });

    const render = () => {
        let visibleCount = 0;

        cards.forEach(card => {
            card.classList.remove('pop-in');
            card.style.animation = 'none';

            const matchFilter = (currentFilter === 'all' || card.getAttribute('data-category') === currentFilter);
            const cardText = (card.textContent || '').toLowerCase();
            const matchSearch = cardText.includes(currentSearch);

            if (matchFilter && matchSearch) {
                card.style.display = 'flex';
                visibleCount++;

                card.classList.remove('item-large', 'item-wide', 'item-tall', 'item-normal');
                if (currentFilter !== 'all' || currentSearch !== '') {
                    card.classList.add('item-normal');
                } else {
                    card.classList.add(card.dataset.layout);
                }

                void card.offsetWidth;
                card.classList.add('pop-in');
                card.style.animation = '';
            } else {
                card.style.display = 'none';
            }
        });

        if (visibleCount === 0) {
            if (noResultsMsg) noResultsMsg.style.display = 'block';
            bentoGrid.style.display = 'none';
        } else {
            if (noResultsMsg) noResultsMsg.style.display = 'none';
            bentoGrid.style.display = 'grid';
        }
    };

    const updateFilterPills = (activeFilter) => {
        if (!filterContainer) return;
        filterContainer.querySelectorAll('.filter-pill').forEach(b => {
            const isActive = (b.getAttribute('data-filter') === activeFilter);
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-pressed', String(isActive));
        });
    };

    const resetAll = () => {
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.hidden = true;
        currentSearch = '';
        currentFilter = 'all';

        updateFilterPills('all');
        render();
        if (searchInput) searchInput.focus();
    };

    if (filterContainer) {
        filterContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-pill');
            if (!btn) return;

            if (searchInput) {
                searchInput.value = '';
            }
            if (clearSearchBtn) {
                clearSearchBtn.hidden = true;
            }
            currentSearch = '';

            currentFilter = btn.getAttribute('data-filter') || 'all';
            updateFilterPills(currentFilter);
            render();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const raw = String(e.target.value || '').slice(0, 50);
            currentSearch = raw.toLowerCase().trim();
            if (clearSearchBtn) {
                clearSearchBtn.hidden = (raw.length === 0);
            }
            render();
        });
    }

    if (clearSearchBtn) clearSearchBtn.addEventListener('click', resetAll);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetAll);

    updateFilterPills('all');
}
