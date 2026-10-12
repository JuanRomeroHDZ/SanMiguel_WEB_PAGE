# Bitácora de Arquitectura y Control de Cambios

> **Regla de Operación:** Este documento centraliza la estructura del proyecto, la ubicación de cada componente y su responsabilidad. Ante cualquier modificación o refactorización futura, esta bitácora debe ser **consultada y actualizada obligatoriamente**.

---

## 1. Mapa de Componentes (¿Dónde está y qué hace cada cosa?)

### Raíz del Proyecto
| Archivo | Ubicación | Responsabilidad principal |
| :--- | :--- | :--- |
| `server.js` | `/server.js` | Servidor local seguro en Node.js puro (ESM). Inyecta cabeceras de seguridad estrictas (CSP, X-Frame-Options, HSTS), sirve archivos estáticos desde `/public` con prevención estricta de path traversal (`decodeURIComponent` + `path.resolve`). |
| `netlify.toml` | `/netlify.toml` | Configuración de despliegue en Netlify: define `publish = "public"` y cabeceras de seguridad HTTP idénticas a producción. |
| `package.json` | `/package.json` | Manifiesto de Node.js (`"type": "module"`, script `"start": "node server.js"`). |
| `.env` / `.env.example` | `/.env` / `/.env.example` | Configuración de entorno del servidor local (`PORT`, `HOST`). `.env` permanece ignorado por git. |
| `.gitignore` | `/.gitignore` | Bloquea la subida de `.env`, dependencias de desarrollo y respaldos temporales a git. |
| `BITACORA.md` | `/BITACORA.md` | Registro de componentes, arquitectura e historial de modificaciones. |

### Frontend Estático (`public/`)
| Archivo | Ubicación | Responsabilidad principal |
| :--- | :--- | :--- |
| `index.html` | `/public/index.html` | Estructura semántica principal, metadatos SEO / Open Graph, Schema.org LocalBusiness, repositorio SVG (`<symbol>`), Bento Grid y mapa de ubicación. Sin elementos o años hardcodeados. |
| `styles.css` | `/public/css/styles.css` | Estilos visuales con variables CSS, layout Bento Grid responsivo, animaciones, reglas de accesibilidad (contraste 4.5:1+, áreas táctiles de 44px+) y soporte para `prefers-reduced-motion`. |
| `main.js` | `/public/js/main.js` | Orquestador de inicio en cliente; importa e inicializa los módulos al cargar `DOMContentLoaded`. |
| `images/` | `/public/images/` | Fotografías de fondo para las tarjetas del catálogo Bento Grid (`.jpeg`), servidas de forma estática y segura. |

### Módulos JavaScript (`public/js/modules/`)
| Módulo | Ubicación | Responsabilidad principal |
| :--- | :--- | :--- |
| `catalog.js` | `/public/js/modules/catalog.js` | Renderizado del Bento Grid desde arreglo estructurado de productos, búsqueda en tiempo real y filtrado de categorías con atributos accesibles (`aria-pressed`). |
| `navigation.js` | `/public/js/modules/navigation.js` | Control de menú móvil, marquesina accesible con pausa, scrollspy y comportamiento del header (se oculta al bajar y reaparece al subir o al llegar al fondo para mostrar el botón de WhatsApp). |
| `schedule.js` | `/public/js/modules/schedule.js` | Verificación en tiempo real del estado Abierto/Cerrado basado exclusivamente en la zona horaria `America/Tijuana` (Lunes a Domingo 7:00 AM - 9:00 PM), con normalización de medianoche (`% 24`). |
| `analytics.js` | `/public/js/modules/analytics.js` | Controlador de analítica y privacidad sin inyección de scripts externos, manteniendo estricto el CSP. |

---

## 2. Historial de Modificaciones

### [2026-10-11] - Integración de fotografías de fondo en tarjetas del Bento Grid
* **Estructura y Assets (`public/images/`):**
  * Organizadas las 8 fotografías provistas (`PanTortillas.jpeg`, `Recargas.jpeg`, `Congelados.jpeg`, `BebidasFrescas.jpeg`, `AbarrotesEspecias.jpeg`, `FarmaciaBasica.jpeg`, `FerreteriaMascotas.jpeg`, `Desechables.jpeg`) dentro de `/public/images/` para habilitar su distribución estática en el servidor y en Netlify.
  * Añadida la extensión `.jpeg` a `MIME_TYPES` en `server.js` para asegurar la cabecera `image/jpeg`.
* **Catálogo Atómico (`public/js/modules/catalog.js`):**
  * Asignada la propiedad `image` correspondiente a los productos en `BENTO_PRODUCTS` (dejando "Botanas & Dulces" con su estilo base al no tener imagen).
  * Renderizadas las capas `.bento-bg-img` y `.bento-bg-overlay` con `aria-hidden="true"`, asegurando que el contenido existente (iconos, marcas de agua, títulos `h3` y descripciones `p`) permanezca al frente con `z-index: 2`.
* **Estilos y Atenuación de Brillo (`public/css/styles.css`):**
  * Fondo visible al 85% de opacidad (`.bento-bg-img`) para destacar la fotografía sin opacar la tarjeta.
  * Incorporada capa `.bento-bg-overlay` con gradiente de atenuación del 15% (oscuro en fondos vino/negros y claro en fondos blancos/suaves) para mitigar reflejos y garantizar la legibilidad y contraste WCAG AA del texto.
  * Agregado micro-zoom interactivo en `:hover` (`scale(1.05)`) y respetada la regla de `prefers-reduced-motion`.

### [2026-10-08] - Correcciones de auditoría y pulido de estándares (Accesibilidad, RFC 9110, Rendimiento, Assets)
* **Accesibilidad Web (WCAG 2.1 AA):**
  * **Sincronización de Foco y `aria-hidden` (WCAG 4.1.2):** En `public/js/modules/navigation.js`, se corrigió el botón "Contacto" del navbar; ahora sincroniza dinámicamente `tabindex="-1"` cuando está oculto visualmente (`aria-hidden="true"`), y se restaura a `tabindex="0"` cuando se expande el menú móvil o cuando la página llega al fondo.
  * **Indicador de Foco Global (WCAG 2.4.7):** Añadida regla `:focus-visible` global en `public/css/styles.css` con contorno de alto contraste (dorado `#D4AF37` y vino `#7A1022`) para garantizar navegación completa y clara por teclado en todos los elementos interactivos.
* **Optimización CSS & Mobile-First:**
  * En `public/css/styles.css`, se eliminaron los parches con `!important` en la barra superior (`.top-bar`) y en el contenedor/botón de contacto móvil (`.nav-contact-wrapper`, `.nav-contact-btn`), reemplazándolos con reglas limpias de cascada y control de `visibility: hidden` / `visible`.
* **Assets & Redes Sociales (SEO/Open Graph):**
  * Generada la imagen faltante `public/og-image.jpg` con dimensiones estándar Open Graph de 1200×630 px, diseñada con la identidad visual de la tienda (paleta vino, dorado y carbón), información de contacto y optimizada para previsualizaciones en WhatsApp, Facebook y Twitter Cards.
* **Seguridad y Cumplimiento RFC en Servidor (`server.js`):**
  * **Cumplimiento RFC 9110 (HEAD):** Las peticiones `HEAD` ahora responden con las cabeceras HTTP correctas (`Content-Type`, `Content-Length`) y finalizan con `res.end()` sin transferir el cuerpo del archivo por stream.
  * **Prevención de Symlink Traversal:** Se incorporó la resolución de rutas reales mediante `fs.realpath` para asegurar que ningún enlace simbólico o alias pueda escapar del directorio raíz público (`public/`).
* **Rendimiento y Buenas Prácticas DOM (`catalog.js`):**
  * Removida la instrucción `void card.offsetWidth` dentro del ciclo `cards.forEach`, eliminando el layout thrashing (cálculo de reflujo sincrónico forzado) al filtrar o escribir en el buscador.
* **Consistencia de Entrada de Usuario (`index.html`):**
  * Añadido el atributo `maxlength="50"` al campo `<input type="search" id="searchInput">`, unificando la restricción de longitud en la interfaz con la validación interna del cliente.
* **Higiene de Código y Documentación:**
  * Removido el evento vacío `touchstart` del botón flotante (FAB) en `navigation.js`.
  * Actualizado el docstring principal de `public/js/main.js` para reflejar con precisión los módulos activos del sistema (navegación, catálogo, horario y analítica).

### [2026-10-08] - Incorporación de Google Analytics (GA4) y verificación de código postal
* **Google Analytics (G-QFVF820EBY):**
  * Implementada carga dinámica y asíncrona de `gtag.js` desde `public/js/modules/analytics.js` sin insertar scripts inline, preservando CSP estricto (`script-src 'self' https://www.googletagmanager.com` sin `'unsafe-inline'`).
  * Integrada verificación de consentimiento previo con banner accesible (`.consent-banner`) que almacena la decisión en `localStorage`. Al aceptar, se dispara la carga de GA4 de inmediato.
  * Actualizadas las directivas CSP en `server.js` y `netlify.toml` (`script-src`, `img-src` y `connect-src`) para permitir los endpoints oficiales de Google Tag Manager y Google Analytics.
* **Código Postal:**
  * Verificado y confirmado el código postal correcto `22330` (Terrazas del Valle, Tijuana) en Schema JSON-LD, sección de ubicación y pie de página de `public/index.html`.

### [2026-10-08] - Eliminación total de reseñas y depuración de datos hardcodeados
* **Eliminación de Reseñas / Opiniones:**
  * Eliminada la sección HTML `#opiniones` y su enlace en el menú de navegación en `public/index.html`.
  * Eliminado el módulo cliente `public/js/modules/reviews.js`.
  * Removida la importación e inicialización de `initReviews` en `public/js/main.js`.
  * Removida la observación de `'opiniones'` del scrollspy en `public/js/modules/navigation.js`.
  * Eliminados más de 300 líneas de estilos CSS dedicados al carrusel y tarjetas de reseñas en `public/css/styles.css`.
  * Eliminada la ruta `/api/reviews` y la importación de funciones en `server.js`.
  * Eliminado el directorio backend `netlify/functions/` y las reglas de redirección en `netlify.toml`.
* **Depuración de Elementos Hardcodeados y Credenciales:**
  * Removidas credenciales y Place IDs de Google Places en `.env` y `.env.example`.
  * Eliminado el año estático `2026` dentro del HTML de `#footerYear` (generado ahora 100% dinámicamente por JavaScript).
  * Depurado el CSP en `server.js` y `netlify.toml`, retirando el dominio externo `lh3.googleusercontent.com` de `img-src` al no ser necesario para avatares de reseñas.

### [2026-10-08] - Corrección integral de visibilidad, accesibilidad y endurecimiento de seguridad
* **Inventario:**
  * Removida la regla `display: none` en `@media (prefers-reduced-motion: reduce)` sobre `.bento-item` y `.pop-in` que ocultaba el catálogo.
  * Cambiado `.svg-defs` a posicionamiento fuera de pantalla (`overflow: hidden; pointer-events: none`) para permitir que `<use>` calcule bounding boxes en Chromium y Safari.
  * Agregado `render()` obligatorio en la inicialización de `catalog.js`.
* **Mapa:**
  * Corregida URL de embed de Google Maps por la URL oficial del comercio `SanMiguel` en Tijuana.
  * Habilitado `pointer-events: auto` en el iframe del mapa para permitir interacción fluida en móviles.
  * Añadido `https://maps.google.com` a la directiva `frame-src` del CSP en `server.js` y `netlify.toml`.
* **Navegación y Header:**
  * Ajustada la lógica de scroll en `navigation.js` para asegurar que al llegar al pie de página (`is-bottom`), el header reaparezca y permita usar el botón de contacto de WhatsApp del navbar.
* **Seguridad de Servidor:**
  * Normalización y decodificación segura de rutas en `server.js` (`decodeURIComponent` + `path.resolve`) para blindar el servicio de archivos estáticos contra path traversal.
