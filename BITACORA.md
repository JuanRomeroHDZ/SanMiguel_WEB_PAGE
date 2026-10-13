# Bitácora de Arquitectura y Control de Cambios

> **Regla de Operación:** Este documento centraliza la estructura del proyecto, la ubicación de cada componente y su responsabilidad. Ante cualquier modificación o refactorización futura, esta bitácora debe ser **consultada y actualizada obligatoriamente**.

---

## 1. Mapa de Componentes (¿Dónde está y qué hace cada cosa?)

### Raíz del Proyecto
| Archivo | Ubicación | Responsabilidad principal |
| :--- | :--- | :--- |
| `index.html` | `/index.html` | Estructura semántica principal, metadatos SEO / Open Graph (`https://romeros.xyz/`), Schema.org LocalBusiness, repositorio SVG (`<symbol>`), Bento Grid y mapa de ubicación. Sin elementos o años hardcodeados. |
| `styles.css` | `/css/styles.css` | Estilos visuales con variables CSS, layout Bento Grid responsivo, animaciones, reglas de accesibilidad (contraste 4.5:1+, áreas táctiles de 44px+) y soporte para `prefers-reduced-motion`. |
| `main.js` | `/js/main.js` | Orquestador de inicio en cliente; importa e inicializa los módulos al cargar `DOMContentLoaded`. |
| `images/` | `/images/` | Fotografías de fondo para las tarjetas del catálogo Bento Grid (`.jpeg`), servidas de forma estática y segura. |
| `robots.txt` | `/robots.txt` | Directivas de indexación y rastreo para Googlebot y buscadores, enlazando al sitemap. |
| `sitemap.xml` | `/sitemap.xml` | Mapa de sitio XML con URL canónica `https://romeros.xyz/` para Google Search Console. |
| `og-image.jpg` | `/og-image.jpg` | Imagen oficial de previsualización para redes sociales (1200×630). |
| `CNAME` | `/CNAME` | Asignación de dominio personalizado `romeros.xyz` para GitHub Pages. |
| `.nojekyll` | `/.nojekyll` | Indica a GitHub Pages que sirva archivos estáticos planos sin compilación de Jekyll. |
| `server.js` | `/server.js` | Servidor local seguro en Node.js puro (ESM). Inyecta cabeceras de seguridad estrictas (CSP, X-Frame-Options, HSTS), sirve archivos estáticos desde la raíz bloqueando rigurosamente archivos internos/sensibles (`FORBIDDEN_FILES` y dotfiles). |
| `netlify.toml` | `/netlify.toml` | Configuración de despliegue en Netlify (`publish = "."`) y cabeceras de seguridad HTTP idénticas a producción. |
| `package.json` | `/package.json` | Manifiesto de Node.js (`"type": "module"`, script `"start": "node server.js"`). |
| `.env` / `.env.example` | `/.env` / `/.env.example` | Configuración de entorno del servidor local (`PORT`, `HOST`). `.env` permanece ignorado por git. |
| `.gitignore` | `/.gitignore` | Bloquea la subida de `.env`, dependencias de desarrollo y respaldos temporales a git. |
| `BITACORA.md` | `/BITACORA.md` | Registro de componentes, arquitectura e historial de modificaciones. |

### Módulos JavaScript (`js/modules/`)
| Módulo | Ubicación | Responsabilidad principal |
| :--- | :--- | :--- |
| `catalog.js` | `/js/modules/catalog.js` | Renderizado del Bento Grid desde arreglo estructurado de productos, búsqueda en tiempo real y filtrado de categorías con atributos accesibles (`aria-pressed`). Rutas de imágenes relativas (`images/`). |
| `navigation.js` | `/js/modules/navigation.js` | Control de menú móvil, marquesina accesible con pausa, scrollspy y comportamiento del header (se oculta al bajar y reaparece al subir o al llegar al fondo para mostrar el botón de WhatsApp). |
| `schedule.js` | `/js/modules/schedule.js` | Verificación en tiempo real del estado Abierto/Cerrado basado exclusivamente en la zona horaria `America/Tijuana` (Lunes a Domingo 7:00 AM - 9:00 PM), con normalización de medianoche (`% 24`). |
| `analytics.js` | `/js/modules/analytics.js` | Controlador de analítica y privacidad sin inyección de scripts externos, manteniendo estricto el CSP. |

---

## 2. Historial de Modificaciones

### [2026-10-12] - Migración a raíz `/` para GitHub Pages, CNAME y `.nojekyll`
* **Compatibilidad Nativa con GitHub Pages:**
  * GitHub Pages requiere que `index.html` resida en la raíz `/` del repositorio (o `/docs`). Se migraron todos los archivos del frontend estático desde `public/` hacia la raíz del repositorio (`index.html`, `css/`, `js/`, `images/`, `robots.txt`, `sitemap.xml`, `og-image.jpg`).
  * Se eliminó el directorio intermedio `public/`.
  * Se creó el archivo `CNAME` con el valor `romeros.xyz` para que GitHub Pages preserve automáticamente el dominio personalizado.
  * Se creó el archivo vacío `.nojekyll` para evitar que GitHub Pages ejecute el compilador de Jekyll y asegurar la entrega directa de módulos ES y assets.
* **Seguridad en `server.js` y Servidor Local:**
  * Al servir desde la raíz en desarrollo local, se implementó una lista de exclusión rigurosa (`FORBIDDEN_FILES`: `server.js`, `package.json`, `.env`, `netlify.toml`, `BITACORA.md`, etc.) y bloqueo de dotfiles para impedir cualquier fuga de código o credenciales vía HTTP.
  * Verificado con pruebas automatizadas (`curl` local): `index.html`, `css/`, `js/`, `images/`, `robots.txt` y `sitemap.xml` devuelven HTTP 200, mientras que `server.js`, `package.json` y `.env` devuelven HTTP 403 Forbidden.
* **Portabilidad de Assets en `catalog.js`:**
  * Se actualizaron las rutas de imágenes en `catalog.js` a relativas (`images/${item.image}` en vez de `/images/...`) para garantizar funcionamiento indistinto en dominio raíz (`romeros.xyz`) o subrutas de GitHub Pages.
* **Actualización en `netlify.toml`:**
  * Ajustada la directiva de publicación de `publish = "public"` a `publish = "."`.

### [2026-10-12] - Configuración de dominio oficial romeros.xyz, auditoría SEO e indexación
* **Dominio Oficial y Metadatos (`romeros.xyz`):**
  * Actualizada la URL canónica (`<link rel="canonical">`), Open Graph (`og:url`, `og:image`), Twitter Cards (`twitter:image`) y Schema.org LocalBusiness JSON-LD (`url`, `image`) hacia `https://romeros.xyz/`.
  * Optimizado el `<title>` y `<meta name="description">` para posicionamiento local en Google ("Abarrotes San Miguel en Tijuana, Terrazas del Valle").
  * Regenerada `public/og-image.jpg` con el dominio `romeros.xyz` en la pastilla de pie de imagen.
* **Archivos de Indexación SEO (`robots.txt` y `sitemap.xml`):**
  * Creado `/public/robots.txt` permitiendo el rastreo de Googlebot y vinculando al sitemap oficial.
  * Creado `/public/sitemap.xml` declarando la URL `https://romeros.xyz/` para su envío a Google Search Console.
  * Agregados los tipos MIME `.xml` y `.txt` en `server.js`.
* **Google Analytics (G-QFVF820EBY) y Privacidad:**
  * Confirmada la compatibilidad total de GA4 tanto en GitHub Pages como en Netlify y dominio personalizado.
  * Verificado el banner de consentimiento previo (`.consent-banner`) que informa al usuario sobre las cookies analíticas y sólo activa el rastreo tras la aceptación explícita.

### [2026-10-12] - Incorporación de Lácteos & Quesos y reordenamiento del Bento Grid (4x4 perfecto)
* **Nueva Tarjeta Lácteos (`Lacteos.jpeg`):**
  * Agregada la tarjeta `lacteos` a `BENTO_PRODUCTS` en `catalog.js` con su imagen correspondiente `/public/images/Lacteos.jpeg` y nuevo símbolo SVG `#svg-cheese` en `public/index.html`.
* **Reorganización del Layout del Grid:**
  * Se reubicó `Bebidas Frescas` (`item-tall`, 1x2) a la columna 4 (derecha), evitando que la orilla derecha quede compuesta únicamente de cuadros pequeños.
  * Se posicionaron `Lácteos & Quesos` (1x1) y `Farmacia Básica` (1x1) en la columna 3 al lado de `Bebidas Frescas`.
  * La cuadrícula de 4 columnas queda 100% compacta y equilibrada (10 tarjetas totales) sin huecos.

### [2026-10-12] - Unificación a tipografía blanca, eliminación de veladura clara e integración de foto para Botanas & Dulces
* **Integración de `BotanasDulces.jpeg`:**
  * Asignada la nueva fotografía provista en `/public/images/BotanasDulces.jpeg` a la tarjeta `botanas` en `BENTO_PRODUCTS` (`catalog.js`), completando el 100% de las 9 tarjetas del catálogo con imagen de fondo.
* **Ajuste de Capa y Tipografía Blanca (`public/css/styles.css`):**
  * Eliminado el gradiente blanco lechoso que generaba aspecto descolorido en tarjetas previamente claras.
  * Unificado el overlay `.bento-bg-overlay` con un degradado oscuro inferior (`rgba(10, 15, 26, 0.85)` a `0.15`) en todas las tarjetas para dar profundidad a las fotografías.
  * Cambiado todo el texto (`h3` y `p`) a color blanco (`#fff`) con sutil sombra (`text-shadow`) para máxima nitidez y legibilidad.
  * Establecido color blanco/dorado con sombra para los iconos superiores (`.bento-icon`) y marcas de agua.

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
