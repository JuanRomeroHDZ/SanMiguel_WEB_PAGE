// netlify/functions/reviews.mjs - Endpoint Serverless protegido para Netlify

let cache = { data: null, expiry: 0 };
const CACHE_TTL_MS = (parseInt(process.env.CACHE_TTL_MINUTES, 10) || 60) * 60 * 1000;

function sanitizeText(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .trim();
}

export async function handler(event, context) {
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Metodo no permitido' })
        };
    }

    const now = Date.now();
    if (cache.data && now < cache.expiry) {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600'
            },
            body: JSON.stringify(cache.data)
        };
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID || 'ChIJL1WmDQA_2YARRj0C3nEAkW4';

    if (!apiKey) {
        return {
            statusCode: 503,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Credenciales no configuradas' })
        };
    }

    try {
        // Peticion a Places API (New)
        const newApiUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews'
        };

        if (process.env.HTTP_REFERRER) {
            headers['Referer'] = process.env.HTTP_REFERRER;
        } else if (event.headers && (event.headers.referer || event.headers.Referer)) {
            headers['Referer'] = event.headers.referer || event.headers.Referer;
        }

        const res = await fetch(newApiUrl, {
            headers,
            signal: AbortSignal.timeout(5000)
        });

        if (res.ok) {
            const data = await res.json();
            const rawReviews = data.reviews || [];

            // Filtrar las 5 mas relevantes / de mejor calificacion
            const safeReviews = rawReviews
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 5)
                .map(r => ({
                    author_name: sanitizeText(r.authorAttribution?.displayName || 'Cliente'),
                    rating: Math.min(Math.max(Number(r.rating) || 5, 1), 5),
                    relative_time_description: sanitizeText(r.relativePublishTimeDescription || ''),
                    text: sanitizeText(r.text?.text || r.originalText?.text || ''),
                    profile_photo_url: typeof r.authorAttribution?.photoUri === 'string' && r.authorAttribution.photoUri.startsWith('https://')
                        ? r.authorAttribution.photoUri
                        : ''
                }));

            const payload = {
                rating: Number(data.rating) || 5.0,
                user_ratings_total: Number(data.userRatingCount) || safeReviews.length,
                reviews: safeReviews
            };

            cache = { data: payload, expiry: now + CACHE_TTL_MS };

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=3600'
                },
                body: JSON.stringify(payload)
            };
        }

        throw new Error(`Google API status: ${res.status}`);
    } catch (err) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Error al recuperar opiniones' })
        };
    }
}
