/**
 * store.js - Gestión del estado de apertura en vivo de Tienda San Miguel
 * Horario: Lunes a Domingo de 7:00 AM a 9:00 PM
 */
export function initStoreStatus() {
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');

    if (!statusBadge || !statusText) return;

    const updateOpenStatus = () => {
        const now = new Date();
        const mins = now.getHours() * 60 + now.getMinutes();
        const open = mins >= 7 * 60 && mins < 21 * 60; // 7:00 AM a 9:00 PM

        statusBadge.classList.toggle('closed', !open);
        statusText.textContent = open ? 'Abierto ahora' : 'Cerrado ahora · Abrimos 7:00 AM';
    };

    updateOpenStatus();
    setInterval(updateOpenStatus, 60000);
}
