/**
 * main.js - Logica de interfaz, horario por zona local y carrusel de reseñas para Tienda San Miguel
 */

// 1. CARGA DIFERIDA Y SEGURA DE GOOGLE ANALYTICS
function initAnalytics() {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-QFVF820EBY');

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-QFVF820EBY';
    document.head.appendChild(script);
}

// 2. HORARIO DE APERTURA SEGÚN LA ZONA HORARIA LOCAL DE TIJUANA (7:00 AM - 9:00 PM)
function initStoreStatus() {
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');

    if (!statusBadge || !statusText) return;

    const updateOpenStatus = () => {
        // Se evalua la hora en la zona horaria del negocio independiente del huso del cliente
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Tijuana',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });
        const parts = formatter.formatToParts(new Date());
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value, 10);
        const minute = parseInt(parts.find(p => p.type === 'minute')?.value, 10);
        const minsInTijuana = (hour * 60) + minute;

        // Abierto de 7:00 AM (420 mins) a 9:00 PM (1260 mins)
        const open = minsInTijuana >= 420 && minsInTijuana < 1260;

        statusBadge.classList.toggle('closed', !open);
        statusText.textContent = open ? 'Abierto hoy' : 'Cerrado ahora · Abrimos 7:00 AM';
    };

    updateOpenStatus();
    setInterval(updateOpenStatus, 60000);
}

// 3. GENERADOR DE NODOS DOM SEGUROS (SIN innerHTML)
function createStarSvgNode(filled = true) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.width = '18px';
    svg.style.height = '18px';
    svg.style.fill = filled ? '#FFB800' : '#D1D5DB';

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    svg.appendChild(path);
    return svg;
}

function createReviewCardNode(review) {
    const card = document.createElement('article');
    card.className = 'review-card';

    const innerDiv = document.createElement('div');

    const header = document.createElement('header');
    header.className = 'review-card-header';

    const avatar = document.createElement('div');
    avatar.className = 'review-avatar';
    avatar.setAttribute('aria-hidden', 'true');

    const photoUrl = typeof review.profile_photo_url === 'string' && review.profile_photo_url.startsWith('https://')
        ? review.profile_photo_url
        : null;

    if (photoUrl) {
        const img = document.createElement('img');
        img.src = photoUrl;
        img.alt = review.author_name || 'Cliente';
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        avatar.appendChild(img);
    } else {
        const initial = document.createElement('span');
        initial.textContent = (review.author_name || 'U').charAt(0).toUpperCase();
        avatar.appendChild(initial);
    }

    const meta = document.createElement('div');
    meta.className = 'review-author-meta';

    const authorName = document.createElement('h4');
    authorName.textContent = review.author_name || 'Cliente de Google';

    const reviewTime = document.createElement('span');
    reviewTime.className = 'review-time';
    reviewTime.textContent = review.relative_time_description || 'Opinión de Google Maps';

    meta.appendChild(authorName);
    meta.appendChild(reviewTime);

    header.appendChild(avatar);
    header.appendChild(meta);

    const starsDiv = document.createElement('div');
    starsDiv.className = 'review-card-stars';
    const ratingNum = Math.min(Math.max(Number(review.rating) || 5, 1), 5);
    starsDiv.setAttribute('aria-label', `Calificación: ${ratingNum} de 5 estrellas`);
    for (let i = 1; i <= 5; i++) {
        starsDiv.appendChild(createStarSvgNode(i <= ratingNum));
    }

    const reviewText = document.createElement('p');
    reviewText.className = 'review-text';
    reviewText.textContent = review.text ? `"${review.text}"` : 'Sin comentarios adicionales.';

    innerDiv.appendChild(header);
    innerDiv.appendChild(starsDiv);
    innerDiv.appendChild(reviewText);

    card.appendChild(innerDiv);
    return card;
}

function renderEmptyReviewsState() {
    const track = document.getElementById('reviewsGrid');
    const dotsContainer = document.getElementById('carouselDots');
    const ratingSummary = document.getElementById('googleRatingSummary');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');

    if (ratingSummary) ratingSummary.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';

    if (dotsContainer) {
        while (dotsContainer.firstChild) dotsContainer.removeChild(dotsContainer.firstChild);
    }

    if (!track) return;
    while (track.firstChild) track.removeChild(track.firstChild);

    const emptyBox = document.createElement('div');
    emptyBox.className = 'reviews-empty-state';

    const title = document.createElement('h3');
    title.textContent = 'Sé el primero en compartir tu experiencia';

    const description = document.createElement('p');
    description.textContent = 'Las opiniones provienen directamente de Google Maps. Déjanos tu valoración para ayudarnos a seguir mejorando cada día.';

    const cta = document.createElement('a');
    cta.href = 'https://www.google.com/maps/place/?q=place_id:ChIJL1WmDQA_2YARRj0C3nEAkW4';
    cta.target = '_blank';
    cta.rel = 'noopener noreferrer';
    cta.className = 'btn-outline';
    cta.textContent = 'Escribir una reseña en Google Maps';

    emptyBox.appendChild(title);
    emptyBox.appendChild(description);
    emptyBox.appendChild(cta);

    track.appendChild(emptyBox);
}

// 4. CARRUSEL AUTOMÁTICO
let carouselTimer = null;
let currentSlideIndex = 0;

function setupCarousel(reviewsCount) {
    const track = document.getElementById('reviewsGrid');
    const dotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const wrapper = document.getElementById('reviewsCarouselWrapper');

    if (!track || !dotsContainer) return;

    while (dotsContainer.firstChild) dotsContainer.removeChild(dotsContainer.firstChild);

    if (reviewsCount <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
    } else {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    }

    for (let i = 0; i < reviewsCount; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = i === 0 ? 'carousel-dot active' : 'carousel-dot';
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

    if (prevBtn) prevBtn.onclick = () => { prevSlide(); resetAutoPlay(); };
    if (nextBtn) nextBtn.onclick = () => { nextSlide(); resetAutoPlay(); };

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

// 5. CONSUMO DE API DE OPINIONES REALES
async function initReviews() {
    const track = document.getElementById('reviewsGrid');
    const ratingSummary = document.getElementById('googleRatingSummary');
    const scoreVal = document.getElementById('ratingScoreVal');

    if (!track) return;

    try {
        const response = await fetch('/api/reviews', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(4000)
        });

        if (!response.ok) {
            renderEmptyReviewsState();
            return;
        }

        const data = await response.json();
        if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
            while (track.firstChild) track.removeChild(track.firstChild);

            data.reviews.forEach(review => {
                track.appendChild(createReviewCardNode(review));
            });

            if (data.rating && typeof data.rating === 'number' && scoreVal && ratingSummary) {
                scoreVal.textContent = data.rating.toFixed(1);
                ratingSummary.style.display = 'flex';
            }

            setupCarousel(data.reviews.length);
        } else {
            renderEmptyReviewsState();
        }
    } catch (_) {
        renderEmptyReviewsState();
    }
}

// 6. CATÁLOGO: BÚSQUEDA Y FILTRADO
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

// 7. INICIALIZADOR PRINCIPAL
document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();
    initStoreStatus();
    initCatalog();
    initReviews();

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

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    const locationSec = document.querySelector('.location-section');
    if (locationSec) revealObserver.observe(locationSec);

    const footerYear = document.getElementById('footerYear');
    if (footerYear) footerYear.textContent = new Date().getFullYear();

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
