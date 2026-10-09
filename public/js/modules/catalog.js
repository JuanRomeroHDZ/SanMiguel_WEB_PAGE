/**
 * catalog.js - Modulo atomico para gestion del catalogo bento grid
 * Renderizado de tarjetas desde arreglo de datos, busqueda en tiempo real y filtrado accesible (aria-pressed)
 */

export const BENTO_PRODUCTS = [
    {
        id: 'pan',
        title: 'Pan y Tortillas',
        description: 'Tortillas de maíz y harina frescas, pan casero, bolillos del día, repostería y más.',
        category: 'alimentos',
        layout: 'item-large',
        bgClass: 'bg-wine',
        icon: '#svg-bread',
        delay: ''
    },
    {
        id: 'recargas',
        title: 'Recargas',
        description: 'Recargas telefónicas, pago de servicios básicos y más.',
        category: 'extras',
        layout: 'item-normal',
        bgClass: 'bg-white',
        icon: '#svg-phone',
        delay: 'delay-1'
    },
    {
        id: 'congelados',
        title: 'Congelados',
        description: 'Mangadas, chocobananas, bolsas de hielo y más.',
        category: 'alimentos',
        layout: 'item-normal',
        bgClass: 'bg-dark',
        icon: '#svg-ice',
        delay: 'delay-2'
    },
    {
        id: 'bebidas',
        title: 'Bebidas Frescas',
        description: 'Agua en garrafón, botellas, refrescos retornables y más.',
        category: 'alimentos',
        layout: 'item-tall',
        bgClass: 'bg-soft',
        icon: '#svg-bottle',
        delay: 'delay-1'
    },
    {
        id: 'abarrotes',
        title: 'Abarrotes y Especias',
        description: 'Condimentos, aceite, latería, abarrotes generales y más.',
        category: 'alimentos',
        layout: 'item-wide',
        bgClass: 'bg-dark',
        icon: '#svg-can',
        delay: 'delay-2'
    },
    {
        id: 'farmacia',
        title: 'Farmacia Básica',
        description: 'Pastillas, vendas, alcohol, algodón, cuidado personal y más.',
        category: 'hogar',
        layout: 'item-normal',
        bgClass: 'bg-white',
        icon: '#svg-pills',
        delay: 'delay-3'
    },
    {
        id: 'botanas',
        title: 'Botanas & Dulces',
        description: 'Sabritas, dulces sueltos, chocolates, cigarros y más.',
        category: 'alimentos',
        layout: 'item-normal',
        bgClass: 'bg-wine',
        icon: '#svg-candy',
        delay: 'delay-2'
    },
    {
        id: 'ferreteria',
        title: 'Ferretería & Mascotas',
        description: 'Focos, pilas, Kola Loka, croquetas, carbón, veladoras, inciensos y más.',
        category: 'extras',
        layout: 'item-wide',
        bgClass: 'bg-soft',
        icon: '#svg-tools',
        delay: 'delay-3'
    },
    {
        id: 'desechables',
        title: 'Desechables',
        description: 'Platos, vasos, aluminio, artículos de limpieza fuertes y más.',
        category: 'hogar',
        layout: 'item-normal',
        bgClass: 'bg-white',
        icon: '#svg-clean',
        delay: 'delay-4'
    }
];

function createSvgUseNode(symbolId, width, height, className) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', '0 0 24 24');

    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', symbolId);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', symbolId);
    svg.appendChild(use);
    return svg;
}

function createBentoCard(item) {
    const card = document.createElement('article');
    const delayClass = item.delay ? ` ${item.delay}` : '';
    card.className = `bento-item ${item.layout} pop-in ${item.bgClass}${delayClass}`;
    card.dataset.category = item.category;
    card.dataset.layout = item.layout;

    const icon = createSvgUseNode(item.icon, 42, 42, 'bento-icon');
    const watermark = createSvgUseNode(item.icon, 160, 160, 'bento-watermark');

    const title = document.createElement('h3');
    title.textContent = item.title;

    const desc = document.createElement('p');
    desc.textContent = item.description;

    card.appendChild(icon);
    card.appendChild(watermark);
    card.appendChild(title);
    card.appendChild(desc);

    return card;
}

export function initCatalog() {
    const filterContainer = document.getElementById('filterContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const noResultsMsg = document.getElementById('noResultsMsg');
    const bentoGrid = document.getElementById('bentoGrid');

    if (!bentoGrid) return;

    // Renderizar tarjetas desde el arreglo atomico de productos
    while (bentoGrid.firstChild) {
        bentoGrid.removeChild(bentoGrid.firstChild);
    }
    BENTO_PRODUCTS.forEach(item => {
        bentoGrid.appendChild(createBentoCard(item));
    });

    const cards = bentoGrid.querySelectorAll('.bento-item');
    let currentFilter = 'all';
    let currentSearch = '';

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
    render();
}
