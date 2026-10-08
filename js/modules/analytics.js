/**
 * analytics.js - Gestion de consentimiento de privacidad e inicializacion condicionada de GA4
 */

const CONSENT_KEY = 'sanmiguel_ga_consent';

export function getConsent() {
    try {
        return localStorage.getItem(CONSENT_KEY);
    } catch (_) {
        return null;
    }
}

export function loadAnalytics() {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-QFVF820EBY', { anonymize_ip: true });

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-QFVF820EBY';
    document.head.appendChild(script);
}

export function initAnalyticsWithConsent() {
    const consent = getConsent();

    if (consent === 'granted') {
        loadAnalytics();
        return;
    }

    if (consent === 'denied') {
        return;
    }

    // Si no ha decidido, mostrar banner accesible
    const banner = document.createElement('aside');
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Configuración de privacidad');

    const message = document.createElement('p');
    message.textContent = 'Utilizamos herramientas analíticas de Google para comprender las visitas y mejorar el servicio de la tienda. Puedes elegir si deseas permitir este análisis.';

    const actions = document.createElement('div');
    actions.className = 'consent-actions';

    const acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'btn-consent btn-accept';
    acceptBtn.textContent = 'Aceptar análisis';
    acceptBtn.addEventListener('click', () => {
        try { localStorage.setItem(CONSENT_KEY, 'granted'); } catch (_) {}
        banner.remove();
        loadAnalytics();
    });

    const declineBtn = document.createElement('button');
    declineBtn.type = 'button';
    declineBtn.className = 'btn-consent btn-decline';
    declineBtn.textContent = 'Solo necesarias';
    declineBtn.addEventListener('click', () => {
        try { localStorage.setItem(CONSENT_KEY, 'denied'); } catch (_) {}
        banner.remove();
    });

    actions.appendChild(acceptBtn);
    actions.appendChild(declineBtn);
    banner.appendChild(message);
    banner.appendChild(actions);
    document.body.appendChild(banner);
}
