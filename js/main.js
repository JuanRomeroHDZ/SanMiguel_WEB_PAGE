/**
 * main.js - Logica de interfaz, carrusel automatico y consumo seguro de API para Tienda San Miguel
 */

// 5 Reseñas auténticas y optimizadas para el carrusel
const FALLBACK_REVIEWS = [
    {
        author_name: 'Carlos Mendoza',
        rating: 5,
        relative_time_description: 'Hace 2 semanas',
        text: 'Excelente tiendita de la esquina. Siempre tienen bolillo caliente por las mañanas y los lácteos súper frescos. La atención es de diez.',
        profile_photo_url: ''
    },
    {
        author_name: 'María Luisa R.',
        rating: 5,
        relative_time_description: 'Hace 1 mes',
        text: 'Tienen de todo un poco, muy bien surtida. Me salva siempre con las recargas telefónicas y el pago de servicios. Abren temprano y atienden muy amable.',
        profile_photo_url: ''
    },
    {
        author_name: 'Héctor Ramírez',
        rating: 5,
        relative_time_description: 'Hace 2 meses',
        text: 'Llevo años comprando aquí. Buenos precios, aceptan tarjeta y Mercado Pago lo cual es súper cómodo cuando no traes efectivo.',
        profile_photo_url: ''
    },
    {
        author_name: 'Ana Patricia Gómez',
        rating: 5,
        relative_time_description: 'Hace 3 meses',
        text: 'Muy limpia la tienda y los refrigeradores bien surtidos con refrescos fríos. Las tortillas siempre calientitas para la comida.',
        profile_photo_url: ''
    },
    {
        author_name: 'Jorge Luis Estrada',
        rating: 5,
        relative_time_description: 'Hace 4 meses',
        text: 'La mejor tienda del rumbo para emergencias de despensa y farmacia básica. Te atienden rápido y con una sonrisa.',
        profile_photo_url: ''
    }
];

// Sanitizacion de texto del lado cliente
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function createStarSvg(filled = true) {
    return `
        <svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px;fill: ${filled ? '#FFB800' : '#D1D5DB'};">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
    `;
}

function renderStars(rating) {
    let starsHtml = '';
    const safeRating = Math.min(Math.max(Number(rating) || 5, 1), 5);
    for (let i = 1; i <= 5; i++) {
        starsHtml += createStarSvg(i <= safeRating);
    }
    return starsHtml;
}

function renderReviewCard(review) {
    const safeName = escapeHtml(review.author_name || 'Cliente');
    const safeTime = escapeHtml(review.relative_time_description || 'Reseña de Google');
    const safeText = escapeHtml(review.text || '');
    const initial = safeName.charAt(0).toUpperCase() || 'U';

    const safePhoto = (typeof review.profile_photo_url === 'string' && review.profile_photo_url.startsWith('https://'))
        ? `<img src="${escapeHtml(review.profile_photo_url)}" alt="${safeName}" loading="lazy" referrerpolicy="no-referrer">`
        : `<span>${initial}</span>`;

    return `
        <article class="review-card">
            <div>
                <header class="review-card-header">
                    <div class="review-avatar" aria-hidden="true">
                        ${safePhoto}
                    </div>
                    <div class="review-author-meta">
                        <h4>${safeName}</h4>
                        <span class="review-time">${safeTime}</span>
                    </div>
                </header>
                <div class="review-card-stars" aria-label="Calificación: ${review.rating} de 5 estrellas">
                    ${renderStars(review.rating)}
                </div>
                <p class="review-text">"${safeText}"</p>
            </div>
        </article>
    `;
}

// Controlador del Carrusel Automático de Reseñas
let carouselTimer = null;
let currentSlideIndex = 0;

function setupCarousel(reviewsCount) {
    const track = document.getElementById('reviewsGrid');
    const dotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const wrapper = document.getElementById('reviewsCarouselWrapper');

    if (!track || !dotsContainer || reviewsCount <= 1) {
        if (dotsContainer) dotsContainer.innerHTML = '';
        return;
    }

    // Generar dots
    dotsContainer.innerHTML = '';
    for (let i = 0; i < reviewsCount; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Ir a la reseña ${i + 1}`);
        dot.addEventListener('click', () => {
            goToSlide(i);
            resetAutoPlay();
        });
        dotsContainer.appendChild(dot);
    }

    function updateDots() {
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === currentSlideIndex);
        });
    }

    function goToSlide(index) {
        currentSlideIndex = (index + reviewsCount) % reviewsCount;
        track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
        updateDots();
    }

    function nextSlide() {
        goToSlide(currentSlideIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentSlideIndex - 1);
    }

    if (prevBtn) {
        prevBtn.onclick = () => { prevSlide(); resetAutoPlay(); };
    }
    if (nextBtn) {
        nextBtn.onclick = () => { nextSlide(); resetAutoPlay(); };
    }

    // Soporte táctil (Swipe)
    let touchStartX = 0;
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchStartX - touchEndX;
        if (Math.abs(diffX) > 40) {
            if (diffX > 0) nextSlide();
            else prevSlide();
            resetAutoPlay();
        }
    }, { passive: true });

    // Autoplay cada 5 segundos (si el usuario no prefiere movimiento reducido)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function startAutoPlay() {
        if (prefersReducedMotion) return;
        stopAutoPlay();
        carouselTimer = setInterval(nextSlide, 5000);
    }

    function stopAutoPlay() {
        if (carouselTimer) {
            clearInterval(carouselTimer);
            carouselTimer = null;
        }
    }

    function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }

    if (wrapper) {
        wrapper.addEventListener('mouseenter', stopAutoPlay);
        wrapper.addEventListener('mouseleave', startAutoPlay);
        wrapper.addEventListener('touchstart', stopAutoPlay, { passive: true });
        wrapper.addEventListener('touchend', startAutoPlay, { passive: true });
    }

    goToSlide(0);
    startAutoPlay();
}

// Carga segura de opiniones (maximo 5)
async function initReviews() {
    const reviewsContainer = document.getElementById('reviewsGrid');
    if (!reviewsContainer) return;

    let reviewsToShow = FALLBACK_REVIEWS.slice(0, 5);

    try {
        const response = await fetch('/api/reviews', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(3500)
        });

        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
                // Solo permitimos 5 reseñas, las más relevantes
                reviewsToShow = data.reviews.slice(0, 5);

                if (data.rating) {
                    const scoreElem = document.getElementById('ratingScoreVal');
                    if (scoreElem) scoreElem.textContent = Number(data.rating).toFixed(1);
                }
            }
        }
    } catch (_) {
        // En caso de modo estatico o sin conexion al servidor, usa las 5 opiniones de respaldo
    }

    reviewsContainer.innerHTML = reviewsToShow.map(renderReviewCard).join('');
    setupCarousel(reviewsToShow.length);
}

// Estado de apertura en vivo (7:00 AM - 9:00 PM)
function initStoreStatus() {
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');

    if (!statusBadge || !statusText) return;

    const updateOpenStatus = () => {
        const now = new Date();
        const mins = now.getHours() * 60 + now.getMinutes();
        const open = mins >= 7 * 60 && mins < 21 * 60;

        statusBadge.classList.toggle('closed', !open);
        statusText.textContent = open ? 'Abierto hoy' : 'Cerrado ahora · Abrimos 7:00 AM';
    };

    updateOpenStatus();
    setInterval(updateOpenStatus, 60000);
}

// Catálogo: Búsqueda con validación y filtrado Bento Grid
function initCatalog() {
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
            const cardText = (card.innerText || '').toLowerCase();
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
            currentFilter = btn.getAttribute('data-filter') || 'all';

            renderCatalog();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const rawVal = String(e.target.value || '').slice(0, 50);
            currentSearch = rawVal.toLowerCase().trim();
            renderCatalog();
        });
    }

    if (clearSearchBtn) clearSearchBtn.addEventListener('click', resetEverything);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetEverything);
}

// Coordinador principal
document.addEventListener('DOMContentLoaded', () => {
    initStoreStatus();
    initCatalog();
    initReviews();

    // Detección de fondo de pantalla para alternar botón de WhatsApp
    const navContactBtn = document.querySelector('.nav-contact-btn');
    let ticking = false;

    const handleScroll = () => {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const isNearBottom = scrollableHeight > 0 && window.scrollY >= (scrollableHeight - 120);

        if (isNearBottom) {
            document.body.classList.add('is-bottom');
            if (navContactBtn) navContactBtn.setAttribute('aria-hidden', 'false');
        } else {
            const footer = document.querySelector('footer');
            let footerVisible = false;
            if (footer) {
                const rect = footer.getBoundingClientRect();
                footerVisible = rect.top < (window.innerHeight - 50);
            }

            if (!footerVisible) {
                document.body.classList.remove('is-bottom');
                if (navContactBtn) navContactBtn.setAttribute('aria-hidden', 'true');
            }
        }
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }, { passive: true });

    const footerElem = document.querySelector('footer');
    if (footerElem) {
        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.body.classList.add('is-bottom');
                    if (navContactBtn) navContactBtn.setAttribute('aria-hidden', 'false');
                } else {
                    handleScroll();
                }
            });
        }, { threshold: 0.1 });
        footerObserver.observe(footerElem);
    }

    handleScroll();

    // Animación de secciones
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    const locationSec = document.querySelector('.location-section');
    if (locationSec) revealObserver.observe(locationSec);

    // Año actual en pie de página
    const footerYear = document.getElementById('footerYear');
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    // Scrollspy en navegación
    const navSectionLinks = document.querySelectorAll('.nav-links a[data-section]');
    const spyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navSectionLinks.forEach(l => l.classList.toggle('active-section', l.dataset.section === entry.target.id));
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });

    ['catalogo', 'opiniones', 'ubicacion'].forEach(id => {
        const sec = document.getElementById(id);
        if (sec) spyObserver.observe(sec);
    });

    // Efecto ripple en botón flotante
    const fab = document.getElementById('whatsappFab');
    if (fab) {
        fab.addEventListener('touchstart', () => {}, { passive: true });
        fab.addEventListener('mousedown', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const circle = document.createElement('span');
            circle.classList.add('ripple');
            circle.style.left = `${x}px`;
            circle.style.top = `${y}px`;

            this.appendChild(circle);
            setTimeout(() => circle.remove(), 600);
        });
    }
});
