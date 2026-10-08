/**
 * reviews.js - Modulo atomico para renderizado y navegacion accesible de opiniones reales
 * Construye elementos usando APIs nativas del DOM sin innerHTML para maxima seguridad
 */

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
    card.setAttribute('role', 'group');
    card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', `Opinión ${index + 1} de ${total}`);

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

function renderEmptyState() {
    const track = document.getElementById('reviewsGrid');
    const controls = document.getElementById('reviewsControls');
    const ratingSummary = document.getElementById('googleRatingSummary');

    if (ratingSummary) ratingSummary.style.display = 'none';
    if (controls) controls.style.display = 'none';

    if (!track) return;
    while (track.firstChild) track.removeChild(track.firstChild);

    const emptyBox = document.createElement('div');
    emptyBox.className = 'reviews-empty-state';

    const title = document.createElement('h3');
    title.textContent = 'Sé el primero en compartir tu experiencia';

    const description = document.createElement('p');
    description.textContent = 'Las opiniones son consultadas directamente de Google Maps. Tu valoración nos ayuda a seguir brindándote la mejor atención.';

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

function setupCarousel(reviewsCount) {
    const track = document.getElementById('reviewsGrid');
    const dotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const controls = document.getElementById('reviewsControls');
    const indicator = document.getElementById('carouselCounter');

    if (!track) return;

    if (reviewsCount <= 1) {
        if (controls) controls.style.display = 'none';
        return;
    }

    if (controls) controls.style.display = 'flex';

    if (dotsContainer) {
        while (dotsContainer.firstChild) dotsContainer.removeChild(dotsContainer.firstChild);
        for (let i = 0; i < reviewsCount; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = i === 0 ? 'carousel-dot active' : 'carousel-dot';
            dot.setAttribute('aria-label', `Ir a reseña ${i + 1} de ${reviewsCount}`);
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    let currentIndex = 0;

    function updateView() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        if (indicator) {
            indicator.textContent = `${currentIndex + 1} / ${reviewsCount}`;
        }

        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.carousel-dot');
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === currentIndex);
            });
        }
    }

    function goToSlide(index) {
        currentIndex = (index + reviewsCount) % reviewsCount;
        updateView();
    }

    function next() {
        goToSlide(currentIndex + 1);
    }

    function prev() {
        goToSlide(currentIndex - 1);
    }

    if (prevBtn) prevBtn.onclick = prev;
    if (nextBtn) nextBtn.onclick = next;

    // Soporte táctil en móviles
    let startX = 0;
    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) next();
            else prev();
        }
    }, { passive: true });

    updateView();
}

export async function initReviews() {
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
            renderEmptyState();
            return;
        }

        const data = await response.json();
        if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
            while (track.firstChild) track.removeChild(track.firstChild);

            data.reviews.forEach((review, idx) => {
                track.appendChild(createReviewCard(review, idx, data.reviews.length));
            });

            if (data.rating && typeof data.rating === 'number' && scoreVal && ratingSummary) {
                scoreVal.textContent = data.rating.toFixed(1);
                ratingSummary.style.display = 'flex';
            }

            setupCarousel(data.reviews.length);
        } else {
            renderEmptyState();
        }
    } catch (_) {
        renderEmptyState();
    }
}
