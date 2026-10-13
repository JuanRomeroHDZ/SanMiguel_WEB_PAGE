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
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

const ROOT_DIR = __dirname;
let REAL_ROOT_DIR = ROOT_DIR;
try {
    REAL_ROOT_DIR = fs.realpathSync(ROOT_DIR);
} catch (_) {}

// Archivos internos que jamás deben exponerse por HTTP
const FORBIDDEN_FILES = new Set([
    'server.js',
    'package.json',
    'package-lock.json',
    'netlify.toml',
    'bitacora.md',
    'readme.md',
    '.env',
    '.env.example',
    '.gitignore',
    '.nojekyll'
]);

function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' https://www.googletagmanager.com",
        "style-src 'self' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com",
        "frame-src https://www.google.com https://maps.google.com",
        "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'"
    ].join('; '));
}

function serveStaticFile(reqPath, res, method = 'GET') {
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

    // Bloquear acceso a archivos ocultos (dotfiles) o archivos internos prohibidos
    const segments = normalizedRelative.split(/[/\\]+/).filter(Boolean);
    const requestedFileName = (segments[segments.length - 1] || '').toLowerCase();

    if (segments.some(seg => seg.startsWith('.')) || FORBIDDEN_FILES.has(requestedFileName)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Acceso denegado');
        return;
    }

    const filePath = path.resolve(ROOT_DIR, '.' + normalizedRelative);

    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Acceso denegado');
        return;
    }

    fs.realpath(filePath, (realErr, realFilePath) => {
        if (realErr) {
            if (realErr.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Recurso no encontrado');
            } else {
                res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Acceso denegado');
            }
            return;
        }

        // Proteger contra symlinks que apunten fuera de ROOT_DIR
        if (!realFilePath.startsWith(REAL_ROOT_DIR)) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Acceso denegado');
            return;
        }

        const realBase = path.basename(realFilePath).toLowerCase();
        if (FORBIDDEN_FILES.has(realBase) || realBase.startsWith('.')) {
            res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Acceso denegado');
            return;
        }

        fs.stat(realFilePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Recurso no encontrado');
                return;
            }

            const ext = path.extname(realFilePath).toLowerCase();
            const contentType = MIME_TYPES[ext];
            if (!contentType) {
                // Solo servir tipos MIME explícitamente permitidos
                res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Acceso denegado');
                return;
            }

            res.writeHead(200, { 
                'Content-Type': contentType,
                'Content-Length': stats.size 
            });

            // RFC 9110: Respuestas HEAD no deben enviar cuerpo
            if (method === 'HEAD') {
                res.end();
                return;
            }

            const stream = fs.createReadStream(realFilePath);
            stream.pipe(res);
        });
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

    serveStaticFile(parsedUrl.pathname, res, req.method);
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

