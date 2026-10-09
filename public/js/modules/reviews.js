/**
 * reviews.js - Modulo atomico para renderizado y navegacion accesible de opiniones
 * Construye elementos usando APIs nativas del DOM sin innerHTML para maxima seguridad (OWASP)
 * Cumple con WCAG 2.2.2 (control de pausa/reanudacion, pausa en hover y foco) y WCAG 4.1.2 (roles ARIA tablist/tab)
 */

export const DEFAULT_REVIEWS = [
    {
        author_name: 'Carlos Mendoza',
        rating: 5,
        relative_time_description: 'Cliente frecuente',
        text: 'Excelente surtido en abarrotes y productos frescos. La atención siempre es amable y rápida.',
        profile_photo_url: null
    },
    {
        author_name: 'María Elena R.',
        rating: 5,
        relative_time_description: 'Vecina de la zona',
        text: 'Tienen de todo para sacarte de un apuro: pan recién llegado, botanas, lácteos y farmacia básica.',
        profile_photo_url: null
    },
    {
        author_name: 'Jorge Luis T.',
        rating: 5,
        relative_time_description: 'Cliente habitual',
        text: 'Muy práctico que acepten Mercado Pago y tarjetas. Las bebidas siempre están bien frías.',
        profile_photo_url: null
    },
    {
        author_name: 'Ana Patricia G.',
        rating: 5,
        relative_time_description: 'Vecina',
        text: 'El servicio es muy atento. Abren temprano todos los días, lo que ayuda mucho antes de ir al trabajo.',
        profile_photo_url: null
    },
    {
        author_name: 'Fernando S.',
        rating: 5,
        relative_time_description: 'Cliente local',
        text: 'Buena ubicación en Terrazas del Valle. Encuentras desde ferretería básica hasta recargas de saldo.',
        profile_photo_url: null
    }
];

let globalAutoPlayTimer = null;
let isUserPaused = false;
let isHoverPaused = false;
let listenersInitialized = false;
let currentReviewsCount = 0;
let currentSlideIndex = 0;
let nextSlideFn = null;
let prevSlideFn = null;
let goToSlideFn = null;

function createStarSvg(filled = true) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'star-icon');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    svg.appendChild(path);

    if (!filled) {
        svg.classList.add('star-empty');
    }
    return svg;
}

function createReviewCard(review, index, total) {
    const card = document.createElement('article');
    card.className = 'review-card';
    card.setAttribute('role', 'tabpanel');
    card.setAttribute('id', `review-slide-${index}`);
    card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', `Opinión ${index + 1} de ${total}`);
    card.setAttribute('tabindex', '0');

    const inner = document.createElement('div');
    inner.className = 'review-card-inner';

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
    authorName.textContent = review.author_name || 'Cliente';

    const reviewTime = document.createElement('span');
    reviewTime.className = 'review-time';
    reviewTime.textContent = review.relative_time_description || 'Cliente verificado';

    meta.appendChild(authorName);
    meta.appendChild(reviewTime);

    header.appendChild(avatar);
    header.appendChild(meta);

    const starsDiv = document.createElement('div');
    starsDiv.className = 'review-card-stars';
    const ratingNum = Math.min(Math.max(Number(review.rating) || 5, 1), 5);
    starsDiv.setAttribute('aria-label', `Calificación: ${ratingNum} de 5 estrellas`);
    for (let i = 1; i <= 5; i++) {
        starsDiv.appendChild(createStarSvg(i <= ratingNum));
    }

    const reviewText = document.createElement('p');
    reviewText.className = 'review-text';
    reviewText.textContent = review.text ? `"${review.text}"` : 'Sin comentarios adicionales.';

    inner.appendChild(header);
    inner.appendChild(starsDiv);
    inner.appendChild(reviewText);

    card.appendChild(inner);
    return card;
}

function setupCarousel(reviewsCount) {
    const track = document.getElementById('reviewsGrid');
    const dotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const playPauseBtn = document.getElementById('carouselPlayPauseBtn');
    const controls = document.getElementById('reviewsControls');
    const indicator = document.getElementById('carouselCounter');
    const wrapper = document.getElementById('reviewsCarouselWrapper');

    if (!track) return;

    if (reviewsCount <= 1) {
        if (controls) controls.style.display = 'none';
        return;
    }

    if (controls) controls.style.display = 'flex';

    if (globalAutoPlayTimer) {
        clearInterval(globalAutoPlayTimer);
        globalAutoPlayTimer = null;
    }

    currentReviewsCount = reviewsCount;
    currentSlideIndex = 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function updatePlayPauseIcon(paused) {
        if (!playPauseBtn) return;
        while (playPauseBtn.firstChild) playPauseBtn.removeChild(playPauseBtn.firstChild);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        if (paused) {
            path.setAttribute('d', 'M8 5v14l11-7z');
            playPauseBtn.setAttribute('aria-label', 'Reanudar carrusel automático');
            playPauseBtn.setAttribute('title', 'Reanudar carrusel automático');
        } else {
            path.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
            playPauseBtn.setAttribute('aria-label', 'Pausar carrusel automático');
            playPauseBtn.setAttribute('title', 'Pausar carrusel automático');
        }
        svg.appendChild(path);
        playPauseBtn.appendChild(svg);
    }

    function updateView() {
        track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;

        if (indicator) {
            indicator.textContent = `${currentSlideIndex + 1} / ${currentReviewsCount}`;
        }

        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.carousel-dot');
            dots.forEach((dot, idx) => {
                const isSelected = (idx === currentSlideIndex);
                dot.classList.toggle('active', isSelected);
                dot.setAttribute('aria-selected', String(isSelected));
            });
        }
    }

    goToSlideFn = (index) => {
        currentSlideIndex = (index + currentReviewsCount) % currentReviewsCount;
        updateView();
    };

    nextSlideFn = () => {
        goToSlideFn(currentSlideIndex + 1);
    };

    prevSlideFn = () => {
        goToSlideFn(currentSlideIndex - 1);
    };

    function startTimer() {
        if (prefersReducedMotion || isUserPaused || isHoverPaused) return;
        stopTimer();
        globalAutoPlayTimer = setInterval(nextSlideFn, 6000);
    }

    function stopTimer() {
        if (globalAutoPlayTimer) {
            clearInterval(globalAutoPlayTimer);
            globalAutoPlayTimer = null;
        }
    }

    if (dotsContainer) {
        dotsContainer.setAttribute('role', 'tablist');
        dotsContainer.setAttribute('aria-label', 'Navegación de reseñas');
        while (dotsContainer.firstChild) dotsContainer.removeChild(dotsContainer.firstChild);

        for (let i = 0; i < currentReviewsCount; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = i === 0 ? 'carousel-dot active' : 'carousel-dot';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
            dot.setAttribute('aria-controls', `review-slide-${i}`);
            dot.setAttribute('id', `carousel-dot-${i}`);
            dot.setAttribute('aria-label', `Ir a reseña ${i + 1} de ${currentReviewsCount}`);
            dot.addEventListener('click', () => {
                goToSlideFn(i);
                startTimer();
            });
            dotsContainer.appendChild(dot);
        }
    }

    if (!listenersInitialized) {
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (prevSlideFn) prevSlideFn();
                startTimer();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (nextSlideFn) nextSlideFn();
                startTimer();
            });
        }

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                isUserPaused = !isUserPaused;
                updatePlayPauseIcon(isUserPaused);
                if (isUserPaused) {
                    stopTimer();
                } else {
                    startTimer();
                }
            });
        }

        if (wrapper) {
            wrapper.addEventListener('mouseenter', () => {
                isHoverPaused = true;
                stopTimer();
            });
            wrapper.addEventListener('mouseleave', () => {
                isHoverPaused = false;
                startTimer();
            });
            wrapper.addEventListener('focusin', () => {
                isHoverPaused = true;
                stopTimer();
            });
            wrapper.addEventListener('focusout', () => {
                isHoverPaused = false;
                startTimer();
            });
        }

        let startX = 0;
        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 40) {
                if (diff > 0 && nextSlideFn) nextSlideFn();
                else if (diff < 0 && prevSlideFn) prevSlideFn();
                startTimer();
            }
        }, { passive: true });

        listenersInitialized = true;
    }

    updatePlayPauseIcon(prefersReducedMotion || isUserPaused);
    updateView();
    startTimer();
}

function renderReviews(reviewsList, rating = 5.0, userRatingCount = null) {
    const track = document.getElementById('reviewsGrid');
    const ratingSummary = document.getElementById('googleRatingSummary');
    const scoreVal = document.getElementById('ratingScoreVal');
    const ratingCountText = document.getElementById('ratingCountText');

    if (!track || !Array.isArray(reviewsList) || reviewsList.length === 0) return;

    while (track.firstChild) {
        track.removeChild(track.firstChild);
    }

    reviewsList.forEach((review, idx) => {
        track.appendChild(createReviewCard(review, idx, reviewsList.length));
    });

    if (scoreVal) {
        scoreVal.textContent = typeof rating === 'number' ? rating.toFixed(1) : '5.0';
    }
    if (ratingCountText) {
        ratingCountText.textContent = userRatingCount
            ? `${userRatingCount} en Google Maps`
            : 'Opiniones de clientes';
    }
    if (ratingSummary) {
        ratingSummary.style.display = 'flex';
    }

    setupCarousel(reviewsList.length);
}

export async function initReviews() {
    const track = document.getElementById('reviewsGrid');
    if (!track) return;

    // 1. Renderizado inicial garantizado (5 opiniones del negocio para carrusel activo inmediato)
    renderReviews(DEFAULT_REVIEWS, 5.0, null);

    // 2. Consulta no bloqueante a la API de Google Places para actualizar dinámicamente si hay datos en vivo
    try {
        const response = await fetch('/api/reviews', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(3500)
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
            renderReviews(data.reviews, data.rating, data.user_ratings_total);
        }
    } catch (_) {
        // En caso de cuota, error de red o API no activada en GCP, se mantienen las opiniones por defecto
    }
}
