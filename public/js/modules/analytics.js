/**
 * analytics.js - Modulo atomico de Google Analytics (GA4) con consentimiento previo
 * Carga asincrona y dinamica de G-QFVF820EBY cumpliendo estrictamente con CSP (sin unsafe-inline)
 * Cumple con privacidad comprobando consentimiento antes de inicializar cookies de rastreo
 */

const GA_MEASUREMENT_ID = 'G-QFVF820EBY';
const CONSENT_STORAGE_KEY = 'tienda_sm_analytics_consent';

function loadGoogleAnalytics() {
    if (window._gaInitialized) return;
    window._gaInitialized = true;

    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        anonymize_ip: true
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
}

function showConsentBanner() {
    const existing = document.getElementById('consentBanner');
    if (existing) return;

    const banner = document.createElement('aside');
    banner.id = 'consentBanner';
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentimiento de cookies y privacidad');

    const text = document.createElement('p');
    text.textContent = 'Utilizamos cookies analíticas para entender el uso del catálogo y mejorar el servicio. Puedes aceptar o continuar navegando sin rastreo.';

    const actions = document.createElement('div');
    actions.className = 'consent-actions';

    const declineBtn = document.createElement('button');
    declineBtn.type = 'button';
    declineBtn.className = 'btn-consent btn-decline';
    declineBtn.textContent = 'Rechazar';
    declineBtn.addEventListener('click', () => {
        try {
            localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
        } catch (_) {}
        banner.remove();
    });

    const acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'btn-consent btn-accept';
    acceptBtn.textContent = 'Aceptar';
    acceptBtn.addEventListener('click', () => {
        try {
            localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
        } catch (_) {}
        banner.remove();
        loadGoogleAnalytics();
    });

    actions.appendChild(declineBtn);
    actions.appendChild(acceptBtn);

    banner.appendChild(text);
    banner.appendChild(actions);

    document.body.appendChild(banner);
}

export function initAnalyticsWithConsent() {
    let consent = null;
    try {
        consent = localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch (_) {}

    if (consent === 'granted') {
        loadGoogleAnalytics();
    } else if (consent === null) {
        showConsentBanner();
    }
}
