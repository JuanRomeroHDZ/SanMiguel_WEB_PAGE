import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Carga de variables de entorno locales
try {
    if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile();
    }
} catch (_) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let PORT = parseInt(process.env.PORT, 10) || 3000;
// Escuchar exclusivamente en loopback local para desarrollo seguro
const HOST = process.env.HOST || '127.0.0.1';

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

const PUBLIC_DIR = path.join(__dirname, 'public');

function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data:",
        "frame-src https://www.google.com https://maps.google.com",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'"
    ].join('; '));
}

function serveStaticFile(reqPath, res) {
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(reqPath);
    } catch (_) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Petición incorrecta');
        return;
    }

    const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
    const normalizedRelative = safePath === '/' ? '/index.html' : safePath;
    const filePath = path.resolve(PUBLIC_DIR, '.' + normalizedRelative);

    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
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

const server = http.createServer(async (req, res) => {
    setSecurityHeaders(res);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Metodo no permitido');
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    serveStaticFile(parsedUrl.pathname, res);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.warn(`Puerto ${PORT} ocupado en ${HOST}. Reintentando en ${PORT + 1}...`);
        PORT += 1;
        server.listen(PORT, HOST);
    } else {
        console.error('Error en el servidor:', err);
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Servidor local activo en http://${HOST}:${PORT}`);
});

export { server };

