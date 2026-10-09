/**
 * main.js - Punto de entrada de la aplicación
 * Orquesta los módulos atómicos de navegación, catálogo, horario y analítica con privacidad
 */

import { initAnalyticsWithConsent } from './modules/analytics.js';
import { initSchedule } from './modules/schedule.js';
import { initCatalog } from './modules/catalog.js';
import { initNavigation } from './modules/navigation.js';

document.addEventListener('DOMContentLoaded', () => {
    initAnalyticsWithConsent();
    initSchedule();
    initCatalog();
    initNavigation();
});
