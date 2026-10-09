/**
 * main.js - Punto de entrada de la aplicacion
 * Orquesta los modulos atomicos de interfaz, catalogo, resenas, privacidad y horario
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
