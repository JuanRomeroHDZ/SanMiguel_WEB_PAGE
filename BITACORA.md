# Bitácora de Arquitectura y Control de Cambios

> **Regla de Operación:** Este documento centraliza la estructura del proyecto, la ubicación de cada componente y su responsabilidad. Ante cualquier modificación o refactorización futura, esta bitácora debe ser **consultada y actualizada obligatoriamente**.

---

## 1. Mapa de Componentes (¿Dónde está y qué hace cada cosa?)

### Raíz del Proyecto
| Archivo | Ubicación | Responsabilidad principal |
| :--- | :--- | :--- |
| `server.js` | `/server.js` | Servidor local seguro en Node.js puro (ESM). Inyecta cabeceras de seguridad estrictas (CSP, X-Frame-Options, HSTS), sirve archivos desde `/public` previniendo path traversal y delega `/api/reviews` a la función serverless. |
| `netlify.toml` | `/netlify.toml` | Configuración de despliegue en Netlify: define `publish = "public"`, enrutamiento de funciones y cabeceras de seguridad idénticas a producción. |
| `package.json` | `/package.json` | Manifiesto de Node.js (`"type": "module"`, script `"start": "node server.js"`). |
| `.env.example` | `/.env.example` | Plantilla pública de variables requeridas (`GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`, `PORT`). |
| `.gitignore` | `/.gitignore` | Bloquea la subida de `.env`, dependencias y respaldos temporales a git. |
| `BITACORA.md` | `/BITACORA.md` | Registro de componentes, arquitectura e historial de modificaciones. |

### Backend Serverless
| Archivo | Ubicación | Responsabilidad principal |
| :--- | :--- | :--- |
| `reviews.mjs` | `/netlify/functions/reviews.mjs` | Endpoint único serverless para consultar Google Places API (New). Sanitiza cadenas, maneja caché en memoria y retorna un JSON seguro sin exponer credenciales. |

### Frontend Estático (`public/`)
| Archivo | Ubicación | Responsabilidad principal |
| :--- | :--- | :--- |
| `index.html` | `/public/index.html` | Estructura semántica principal, metadatos SEO / Open Graph, Schema.org LocalBusiness, repositorio SVG (`<symbol>`), Bento Grid, carrusel accesible y mapa de ubicación. |
| `styles.css` | `/public/css/styles.css` | Estilos visuales con variables CSS, layout Bento Grid responsivo, animaciones, reglas de accesibilidad (contraste 4.5:1+, áreas táctiles de 44px+) y soporte para `prefers-reduced-motion`. |
| `main.js` | `/public/js/main.js` | Orquestador de inicio en cliente; importa e inicializa los módulos al cargar `DOMContentLoaded`. |

### Módulos JavaScript (`public/js/modules/`)
| Módulo | Ubicación | Responsabilidad principal |
| :--- | :--- | :--- |
| `catalog.js` | `/public/js/modules/catalog.js` | Renderizado del Bento Grid desde arreglo de datos estructurado, búsqueda en tiempo real y filtrado de categorías con atributos accesibles (`aria-pressed`). |
| `reviews.js` | `/public/js/modules/reviews.js` | Carrusel automático de 5 testimonios con controles WCAG 2.2.2 (play/pause, pausa al hover y foco), navegación por pestañas (`role="tab"`), gestos táctiles y sincronización no bloqueante con Google Places. |
| `navigation.js` | `/public/js/modules/navigation.js` | Control de menú móvil, marquesina accesible con pausa, scrollspy y comportamiento del header (se oculta al bajar y reaparece al subir o al llegar al fondo para mostrar el botón de WhatsApp). |
| `schedule.js` | `/public/js/modules/schedule.js` | Verificación en tiempo real del estado Abierto/Cerrado basado exclusivamente en la zona horaria `America/Tijuana` (Lunes a Domingo 7:00 AM - 9:00 PM). |
| `analytics.js` | `/public/js/modules/analytics.js` | Controlador de analítica y privacidad sin inyección de scripts externos, manteniendo estricto el CSP. |

---

## 2. Historial de Modificaciones

### [2026-10-08] - Corrección integral de visibilidad, accesibilidad y endurecimiento de seguridad
* **Inventario:**
  * Removida la regla `display: none` en `@media (prefers-reduced-motion: reduce)` sobre `.bento-item` y `.pop-in` que ocultaba el catálogo.
  * Cambiado `.svg-defs` a posicionamiento fuera de pantalla (`overflow: hidden; pointer-events: none`) para permitir que `<use>` calcule bounding boxes en Chromium y Safari.
  * Agregado `render()` obligatorio en la inicialización de `catalog.js`.
* **Mapa:**
  * Corregida URL corrupta de embed de Google Maps por la URL oficial del comercio `SanMiguel` en Tijuana.
  * Habilitado `pointer-events: auto` en el iframe del mapa para permitir interacción fluida en móviles.
  * Añadido `https://maps.google.com` a la directiva `frame-src` del CSP en `server.js` y `netlify.toml`.
* **Opiniones:**
  * Rediseñado el módulo `reviews.js` para renderizar de inmediato 5 opiniones locales, evitando que el carrusel se oculte cuando la API de Google retorne 403 o no tenga reseñas aún.
  * Conectado a consulta en segundo plano no bloqueante para reemplazar testimonios automáticamente cuando la API de Google Places esté activa.
* **Navegación y Header:**
  * Ajustada la lógica de scroll en `navigation.js` para asegurar que al llegar al pie de página (`is-bottom`), el header reaparezca y permita usar el botón de contacto de WhatsApp del navbar.
* **Seguridad de Servidor:**
  * Normalización y decodificación segura de rutas en `server.js` (`decodeURIComponent` + `path.resolve`) para blindar el servicio de archivos estáticos contra path traversal.
