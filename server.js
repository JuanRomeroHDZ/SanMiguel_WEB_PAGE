import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Carga de variables de entorno
try {
    if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile();
    }
} catch (_) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let PORT = parseInt(process.env.PORT, 10) || 3000;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const PLACE_ID = process.env.GOOGLE_PLACE_ID || 'ChIJL1WmDQA_2YARRj0C3nEAkW4';
const CACHE_TTL_MS = (parseInt(process.env.CACHE_TTL_MINUTES, 10) || 60) * 60 * 1000;

// Tipos MIME permitidos
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

// Cache en memoria para resguardar cuota
let reviewsCache = { data: null, expiry: 0 };

// Control de tasa de peticiones por IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_API_REQ = 30;

function checkRateLimit(ip) {
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW };
    if (now > record.reset) {
        record.count = 1;
        record.reset = now + RATE_LIMIT_WINDOW;
    } else {
        record.count++;
    }
    rateLimitMap.set(ip, record);
    return record.count <= MAX_API_REQ;
}

// Sanitizacion de cadenas para evitar inyeccion
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

// Cabeceras de seguridad HTTP
function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: https://www.google-analytics.com https://lh3.googleusercontent.com",
        "frame-src https://www.google.com",
        "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com"
    ].join('; '));
}

// Manejador del endpoint de resenas (Places API New)
async function handleReviewsApi(req, res, clientIp) {
    if (!checkRateLimit(clientIp)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Demasiadas solicitudes. Intente mas tarde.' }));
        return;
    }

    const now = Date.now();
    if (reviewsCache.data && now < reviewsCache.expiry) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(reviewsCache.data));
        return;
    }

    if (!API_KEY) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Servicio no configurado.' }));
        return;
    }

    try {
        const newApiUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE_ID)}?languageCode=es`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': API_KEY,
            'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews'
        };

        if (process.env.HTTP_REFERRER) {
            headers['Referer'] = process.env.HTTP_REFERRER;
        } else if (req.headers.referer || req.headers.Referer) {
            headers['Referer'] = req.headers.referer || req.headers.Referer;
        }

        const googleRes = await fetch(newApiUrl, {
            headers,
            signal: AbortSignal.timeout(5000)
        });

        if (!googleRes.ok) throw new Error(`Google API status: ${googleRes.status}`);
        const data = await googleRes.json();

        const rawReviews = data.reviews || [];
        // Ordenar por calificacion y tomar las 5 mas relevantes
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

        reviewsCache = { data: payload, expiry: now + CACHE_TTL_MS };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error al recuperar opiniones.' }));
    }
}

// Servidor de archivos estaticos
function serveStaticFile(reqPath, res) {
    const safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(__dirname, safePath === '/' ? 'index.html' : safePath);

    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Acceso denegado');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Recurso no encontrado');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
}

// Creacion del servidor
const server = http.createServer((req, res) => {
    setSecurityHeaders(res);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Metodo no permitido');
        return;
    }

    const clientIp = req.socket.remoteAddress || '127.0.0.1';
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (parsedUrl.pathname === '/api/reviews') {
        handleReviewsApi(req, res, clientIp);
        return;
    }

    serveStaticFile(parsedUrl.pathname, res);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.warn(`Puerto ${PORT} ocupado. Reintentando en ${PORT + 1}...`);
        PORT += 1;
        server.listen(PORT);
    } else {
        console.error('Error en el servidor:', err);
    }
});

server.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
});
