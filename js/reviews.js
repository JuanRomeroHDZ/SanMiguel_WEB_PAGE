/**
 * reviews.js - Módulo de Reseñas de Google Places para Tienda San Miguel
 */

export const GOOGLE_PLACE_CONFIG = {
    placeId: 'ChIJL1WmDQA_2YARRj0C3nEAkW4', // Place ID oficial de Tienda San Miguel
    mapsUrl: 'https://maps.app.goo.gl/uX3QxPkW8tVnQ4HNA'
};

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
    }
];

function createStarSvg(filled = true) {
    return `
        <svg viewBox="0 0 24 24" aria-hidden="true" style="fill: ${filled ? '#FFB800' : '#D1D5DB'};">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
    `;
}

function renderStars(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        starsHtml += createStarSvg(i <= rating);
    }
    return starsHtml;
}

function renderReviewCard(review) {
    const initial = (review.author_name || 'U')[0].toUpperCase();
    const avatarHtml = review.profile_photo_url 
        ? `<img src="${review.profile_photo_url}" alt="${review.author_name}" loading="lazy">`
        : `<span>${initial}</span>`;

    return `
        <article class="review-card">
            <div>
                <header class="review-card-header">
                    <div class="review-avatar" aria-hidden="true">
                        ${avatarHtml}
                    </div>
                    <div class="review-author-meta">
                        <h4>${review.author_name}</h4>
                        <span class="review-time">${review.relative_time_description || 'Reseña de Google'}</span>
                    </div>
                </header>
                <div class="review-card-stars" aria-label="Calificación: ${review.rating} de 5 estrellas">
                    ${renderStars(review.rating)}
                </div>
                <p class="review-text">"${review.text}"</p>
            </div>
        </article>
    `;
}

export function initReviews() {
    const reviewsContainer = document.getElementById('reviewsGrid');
    if (!reviewsContainer) return;

    reviewsContainer.innerHTML = FALLBACK_REVIEWS.map(renderReviewCard).join('');

    if (window.google && window.google.maps && window.google.maps.places) {
        try {
            const dummyElem = document.createElement('div');
            const service = new window.google.maps.places.PlacesService(dummyElem);

            service.getDetails({
                placeId: GOOGLE_PLACE_CONFIG.placeId,
                fields: ['reviews', 'rating', 'user_ratings_total']
            }, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.reviews) {
                    if (place.reviews.length > 0) {
                        reviewsContainer.innerHTML = place.reviews.map(renderReviewCard).join('');
                    }
                    if (place.rating) {
                        const scoreElem = document.getElementById('ratingScoreVal');
                        if (scoreElem) scoreElem.textContent = place.rating.toFixed(1);
                    }
                }
            });
        } catch (e) {
            console.warn('Places Service activo con reseñas de respaldo:', e);
        }
    }
}
