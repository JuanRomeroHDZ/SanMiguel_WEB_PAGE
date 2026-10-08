// netlify/functions/reviews.mjs - Endpoint Serverless unico para consultar Google Places API (New)

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

let memoryCache = { payload: null, timestamp: 0 };
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos de cache en memoria

export async function handler(event) {
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Metodo no permitido' })
        };
    }

    // Retornar de cache en memoria si aun es valido para reducir peticiones a Google
    if (memoryCache.payload && (Date.now() - memoryCache.timestamp < CACHE_TTL_MS)) {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=1800'
            },
            body: JSON.stringify(memoryCache.payload)
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
        const apiUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`;
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

        const res = await fetch(apiUrl, {
            headers,
            signal: AbortSignal.timeout(5000)
        });

        if (res.ok) {
            const data = await res.json();
            const rawReviews = data.reviews || [];

            // Conservar el orden natural provisto por Google sin reordenar, limitando a 5
            const safeReviews = rawReviews.slice(0, 5).map(r => ({
                author_name: sanitizeText(r.authorAttribution?.displayName || 'Cliente'),
                rating: Number(r.rating) || 5,
                relative_time_description: sanitizeText(r.relativePublishTimeDescription || ''),
                text: sanitizeText(r.text?.text || r.originalText?.text || ''),
                profile_photo_url: typeof r.authorAttribution?.photoUri === 'string' && r.authorAttribution.photoUri.startsWith('https://')
                    ? r.authorAttribution.photoUri
                    : ''
            }));

            const payload = {
                rating: typeof data.rating === 'number' ? data.rating : null,
                user_ratings_total: typeof data.userRatingCount === 'number' ? data.userRatingCount : 0,
                reviews: safeReviews
            };

            memoryCache.payload = payload;
            memoryCache.timestamp = Date.now();

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=1800'
                },
                body: JSON.stringify(payload)
            };
        }

        return {
            statusCode: res.status,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'No se pudo obtener información de Google Places', status: res.status })
        };
    } catch (_) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Error interno al consultar opiniones' })
        };
    }
}
