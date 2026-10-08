/**
 * catalog.js - Lógica de búsqueda interactiva y filtrado de categorías en Bento Grid
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

    // Guardar el diseño original de cada tarjeta Bento
    cards.forEach(card => {
        if (card.classList.contains('item-large')) card.dataset.layout = 'item-large';
        else if (card.classList.contains('item-tall')) card.dataset.layout = 'item-tall';
        else if (card.classList.contains('item-wide')) card.dataset.layout = 'item-wide';
        else card.dataset.layout = 'item-normal';
    });

    const renderCatalog = () => {
        let visibleCount = 0;

        cards.forEach(card => {
            card.classList.remove('pop-in');
            card.style.animation = 'none';

            const matchFilter = (currentFilter === 'all' || card.getAttribute('data-category') === currentFilter);
            const cardText = card.innerText.toLowerCase();
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

                void card.offsetWidth; // Forzar reflow para reiniciar la animación
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

    const resetEverything = () => {
        if (searchInput) searchInput.value = '';
        currentSearch = '';
        currentFilter = 'all';
        if (filterContainer) {
            filterContainer.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            const defaultPill = filterContainer.querySelector('[data-filter="all"]');
            if (defaultPill) defaultPill.classList.add('active');
        }
        renderCatalog();
    };

    if (filterContainer) {
        filterContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-pill');
            if (!btn) return;

            if (searchInput) { 
                searchInput.value = ''; 
                currentSearch = ''; 
            }

            filterContainer.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');

            renderCatalog();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            renderCatalog();
        });
    }

    if (clearSearchBtn) clearSearchBtn.addEventListener('click', resetEverything);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetEverything);
}
